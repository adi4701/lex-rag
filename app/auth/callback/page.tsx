'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    // Supabase client automatically handles the hash/query params on load
    // We just need to wait a brief moment for it to process and save to local storage
    const processAuth = async () => {
      try {
        // Force session refresh to ensure tokens are saved
        await supabase.auth.getSession();
        
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          window.close();
        } else {
          window.location.href = '/dashboard/chat';
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR' }, '*');
          window.close();
        }
      }
    };
    
    // Small delay to ensure Supabase client has processed the URL
    setTimeout(processAuth, 500);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="text-white text-lg font-medium">Completing authentication...</div>
    </div>
  );
}
