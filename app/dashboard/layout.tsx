'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MessageSquare, FileText, BarChart2, Settings, LogOut, Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          router.push('/auth');
        } else {
          setUser(session.user);
        }
      } catch (err) {
        console.error("Failed to get session", err);
        router.push('/auth');
      }
    };
    checkUser();
  }, [router]);

  if (!user) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white">Loading...</div>;

  const navItems = [
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-300 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0f1e]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1e40af] rounded flex items-center justify-center font-bold text-white">L</div>
          <span className="font-bold text-white">LexRAG</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 border-r border-white/10 bg-[#0a0f1e] flex-shrink-0 flex flex-col`}>
        <div className="hidden md:flex items-center gap-2 p-6 border-b border-white/10">
          <div className="w-8 h-8 bg-[#1e40af] rounded flex items-center justify-center font-bold text-white">L</div>
          <span className="font-bold text-white text-xl">LexRAG</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-slate-500 truncate">Analyst</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
