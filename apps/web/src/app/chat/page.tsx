'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { ChatWithData } from '@/components/chat-with-data';

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Chat with Data" />
        <main className="flex-1 overflow-y-auto p-6">
          <ChatWithData />
        </main>
      </div>
    </div>
  );
}

