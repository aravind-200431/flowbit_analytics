# Alternative main.py using psycopg instead of psycopg2
# If psycopg2-binary fails, rename this file to main.py and use requirements-alternative.txt

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from groq import Groq
import psycopg
from psycopg.rows import dict_row
import re

load_dotenv()

app = FastAPI(title="Vanna AI Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")

groq_client = Groq(api_key=GROQ_API_KEY)

# Database connection function (psycopg uses connection string directly)
def get_db_connection():
    # psycopg accepts connection string directly
    return psycopg.connect(DATABASE_URL)

# Get database schema for context
def get_schema_info():
    """Get database schema information for LLM context"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        schema_info = []
        
        # Get all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        for table in tables:
            cursor.execute(f"""
                SELECT 
                    column_name, 
                    data_type,
                    is_nullable
                FROM information_schema.columns 
                WHERE table_name = '{table}'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            
            schema_info.append({
                "table": table,
                "columns": [{"name": col[0], "type": col[1], "nullable": col[2]} for col in columns]
            })
        
        cursor.close()
        conn.close()
        return schema_info
    except Exception as e:
        print(f"Error getting schema: {e}")
        return []

# Cache schema info
schema_info = get_schema_info()

def generate_sql_from_nl(query: str) -> str:
    """Generate SQL from natural language using Groq"""
    
    # Build schema context with actual table names
    schema_text = "Database Schema (PostgreSQL - use EXACT table names as shown):\n"
    for table_info in schema_info:
        table_name = table_info['table']
        schema_text += f"\nTable: \"{table_name}\" (use EXACT name with quotes if needed)\n"
        schema_text += "Columns:\n"
        for col in table_info['columns']:
            schema_text += f"  - {col['name']} ({col['type']})"
            if col['nullable'] == 'YES':
                schema_text += " [nullable]"
            schema_text += "\n"
    
    # Get actual table names for examples
    actual_tables = [t['table'] for t in schema_info]
    table_list = ', '.join([f'"{t}"' for t in actual_tables])
    
    # Add common query examples with actual table names
    examples = f"""
Example queries (using actual table names: {table_list}):
- "What's the total spend?" -> SELECT SUM("totalAmount") FROM "Invoice";
- "List top 5 vendors by spend" -> SELECT v."vendorName", SUM(i."totalAmount") as total_spend FROM "Vendor" v JOIN "Invoice" i ON v.id = i."vendorId" GROUP BY v.id, v."vendorName" ORDER BY total_spend DESC LIMIT 5;
- "Show overdue invoices" -> SELECT * FROM "Invoice" i JOIN "Payment" p ON i.id = p."invoiceId" WHERE p."dueDate" < CURRENT_DATE AND p.status != 'paid';
"""
    
    prompt = f"""You are a SQL expert. Generate a PostgreSQL query based on the natural language question.

{schema_text}

{examples}

CRITICAL RULES:
- Only generate SELECT queries (read-only)
- Use proper PostgreSQL syntax
- Use table names EXACTLY as shown in the schema (with quotes if they contain capital letters: "Invoice", "Vendor", "Customer", "Payment", "LineItem", "Document")
- Use column names EXACTLY as shown in the schema (with quotes if they contain capital letters: "totalAmount", "vendorName", etc.)
- For dates, use CURRENT_DATE, NOW(), or proper date functions
- Use proper JOINs when needed ("Invoice"."vendorId" = "Vendor".id, etc.)
- Return ONLY the SQL query, no explanations or markdown formatting
- Do not include any text before or after the SQL query
- PostgreSQL is case-sensitive - use EXACT table and column names from the schema

Natural language question: {query}

SQL Query:"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a SQL expert. Generate only valid PostgreSQL SELECT queries. Return only the SQL, no explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1000
        )
        
        sql = response.choices[0].message.content.strip()
        
        # Clean up SQL - remove markdown code blocks if present
        sql = re.sub(r'^```sql\n?', '', sql, flags=re.IGNORECASE)
        sql = re.sub(r'^```\n?', '', sql)
        sql = re.sub(r'\n?```$', '', sql)
        sql = sql.strip()
        
        # Ensure table names are properly quoted if they contain capital letters
        actual_tables = ['Customer', 'Document', 'Invoice', 'LineItem', 'Payment', 'Vendor']
        for table in actual_tables:
            pattern = rf'(?<!"){re.escape(table)}(?!")'
            sql = re.sub(pattern, f'"{table}"', sql, flags=re.IGNORECASE)
        
        # Basic validation - ensure it's a SELECT query
        if not sql.upper().startswith('SELECT'):
            raise ValueError("Generated query is not a SELECT statement")
        
        return sql
    except Exception as e:
        raise Exception(f"Error generating SQL: {str(e)}")

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    sql: str
    data: list
    explanation: str = ""

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process natural language query and return SQL + results"""
    try:
        query = request.query
        
        if not query or not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Generate SQL using Groq
        sql = generate_sql_from_nl(query)
        
        if not sql:
            raise HTTPException(status_code=400, detail="Could not generate SQL from query")
        
        # Execute SQL (psycopg uses dict_row for dictionary results)
        conn = get_db_connection()
        cursor = conn.cursor(row_factory=dict_row)
        
        try:
            cursor.execute(sql)
            results = cursor.fetchall()
            
            # Convert to list of dicts (already dicts with dict_row)
            data = [dict(row) for row in results]
            
            # Generate explanation
            explanation = f"Query executed successfully. Returned {len(data)} row(s)."
            
            return ChatResponse(
                sql=sql,
                data=data,
                explanation=explanation
            )
        except psycopg.Error as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error executing SQL: {str(e)}")
        finally:
            cursor.close()
            conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

