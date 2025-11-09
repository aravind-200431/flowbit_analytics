'use client';

import { MoreVertical, User } from 'lucide-react';

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">aravind</div>
            <div className="text-xs text-gray-500">Admin</div>
          </div>
          <MoreVertical className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </header>
  );
}

