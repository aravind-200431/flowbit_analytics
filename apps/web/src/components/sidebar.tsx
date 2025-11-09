'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Folder, 
  Building2, 
  Users, 
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Chat with Data', href: '/chat' },
  { icon: FileText, label: 'Invoice', href: '/invoice' },
  { icon: Folder, label: 'Other files', href: '/files' },
  { icon: Building2, label: 'Departments', href: '/departments' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-300 relative",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Top Section - Logo and Organization */}
      <div className={cn(
        "border-b border-gray-200",
        collapsed ? "p-4" : "p-6"
      )}>
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="h-10 w-10 rounded-full bg-yellow-400 border-4 border-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-sm">L</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">Buchhaltung</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">12 members</span>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute top-4 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 hover:text-gray-900 z-10"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        {!collapsed && (
          <div className="px-4 mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              GENERAL
            </div>
          </div>
        )}
        <nav className={cn("space-y-1", collapsed ? "px-2" : "px-2")}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const href = item.href === '/dashboard' ? '/' : item.href;
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed 
                    ? 'justify-center px-3 py-2.5' 
                    : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom - Flowbit AI Logo */}
      <div className="p-6 border-t border-gray-200">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "gap-2"
        )}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-gray-900 truncate">Flowbit AI</span>
          )}
        </div>
      </div>
    </div>
  );
}

