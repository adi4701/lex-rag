'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard/chat');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1e40af] rounded flex items-center justify-center font-bold text-white mx-auto mb-4 text-xl">L</div>
          <h1 className="text-2xl font-bold text-white">Welcome to LexRAG</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to access your secure legal workspace.</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#1e40af',
                  brandAccent: '#1d4ed8',
                  inputText: 'white',
                  inputBackground: 'rgba(255,255,255,0.05)',
                  inputBorder: 'rgba(255,255,255,0.1)',
                }
              }
            },
            className: {
              container: 'text-white',
              label: 'text-slate-300',
              button: 'font-medium',
            }
          }}
          providers={['google', 'github']}
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/chat`}
        />
      </div>
    </div>
  );
}
