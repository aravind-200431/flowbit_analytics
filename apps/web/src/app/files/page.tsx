'use client';

import { Sidebar } from '../../components/sidebar';
import { Header } from '../../components/header';

export default function FilesPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Other files" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Files</h2>
              <p className="text-gray-600">File management page coming soon...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

