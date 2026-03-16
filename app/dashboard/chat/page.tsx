'use client';

import { useState, useRef, useEffect } from 'react';
import { useSSEQuery } from '@/hooks/useSSEQuery';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import { Send, FileText, Plus, AlertTriangle, ChevronRight, Search, X } from 'lucide-react';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [sessionId, setSessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
  });
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [docType, setDocType] = useState<string>('');
  const { sendQuery, isStreaming, tokens, metadata, error } = useSSEQuery();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, tokens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    const newQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: newQuery }]);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await sendQuery(newQuery, sessionId, session.access_token, docType ? [docType] : undefined);
  };

  useEffect(() => {
    if (!isStreaming && tokens) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(prev => [...prev, { role: 'assistant', content: tokens }]);
    }
  }, [isStreaming, tokens]);

  const handleNewChat = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      setSessionId(crypto.randomUUID());
    } else {
      setSessionId(Math.random().toString(36).substring(2, 15));
    }
    setMessages([]);
  };

  const renderMessageContent = (content: string) => {
    // Replace [SOURCE: uuid] with styled badges
    const parts = content.split(/(\[SOURCE: [a-f0-9]+\]|\[UNVERIFIED ⚠️\])/g);
    
    return (
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800/50">
        {parts.map((part, i) => {
          if (part.startsWith('[SOURCE:')) {
            const uuid = part.match(/\[SOURCE: ([a-f0-9]+)\]/)?.[1];
            return (
              <button 
                key={i} 
                onClick={() => { setSelectedCitation(uuid || null); setDrawerOpen(true); }}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono hover:bg-blue-500/30 transition-colors border border-blue-500/30 align-middle"
              >
                <FileText className="w-3 h-3" /> {uuid?.slice(0, 6)}
              </button>
            );
          }
          if (part === '[UNVERIFIED ⚠️]') {
            return (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded bg-amber-500/20 text-amber-400 text-xs font-mono border border-amber-500/30 align-middle">
                <AlertTriangle className="w-3 h-3" /> UNVERIFIED
              </span>
            );
          }
          return <ReactMarkdown key={i} components={{ p: ({node, ...props}) => <span {...props} /> }}>{part}</ReactMarkdown>;
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full relative">
      {/* Sessions Sidebar */}
      <div className="hidden lg:flex w-64 border-r border-white/10 flex-col bg-[#0a0f1e]/50">
        <div className="p-4">
          <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 bg-[#1e40af] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Mock session list */}
          <button className="w-full text-left px-3 py-3 rounded-lg bg-white/5 text-white text-sm truncate">
            Current Session
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0f1e]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">What would you like to know?</h2>
              <p className="text-slate-400 mb-8">Ask questions about your uploaded NDAs, Employment Contracts, and Board Resolutions.</p>
              
              <div className="grid grid-cols-1 gap-3 w-full">
                {["What are the termination clauses in the Acme NDA?", "Summarize the vesting schedule for John Doe.", "List all indemnification obligations."].map((q, i) => (
                  <button key={i} onClick={() => setQuery(q)} className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors">
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${msg.role === 'user' ? 'bg-[#1e40af] text-white' : 'bg-white/5 border border-white/10 text-slate-200'}`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  renderMessageContent(msg.content)
                )}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white/5 border border-white/10 text-slate-200">
                {tokens ? renderMessageContent(tokens) : (
                  <div className="flex space-x-1 items-center h-6">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-[#0a0f1e]">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {['', 'NDA', 'EMPLOYMENT_CONTRACT', 'BOARD_RESOLUTION', 'SHAREHOLDER_AGREEMENT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    docType === type 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {type === '' ? 'All Docs' : type.replace('_', ' ')}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about your documents..."
                className="w-full bg-transparent text-white placeholder-slate-500 resize-none max-h-32 min-h-[44px] p-2 focus:outline-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!query.trim() || isStreaming}
                className="p-2 bg-[#1e40af] hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors flex-shrink-0 mb-1"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            
            {metadata && (
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-3 justify-center">
                <span>Latency: {metadata.latency_ms}ms</span>
                <span>•</span>
                <span>Chunks: {metadata.retrieved_count}</span>
                <span>•</span>
                <span className={metadata.cache_hit ? 'text-emerald-400' : ''}>Cache: {metadata.cache_hit ? 'HIT' : 'MISS'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citation Drawer */}
      {drawerOpen && (
        <div className="absolute top-0 right-0 h-full w-80 bg-[#0f172a] border-l border-white/10 shadow-2xl flex flex-col z-10">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Source Context
            </h3>
            <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">UUID</div>
              <div className="font-mono text-sm text-slate-300 bg-black/30 p-2 rounded border border-white/5 break-all">
                {selectedCitation}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Extracted Text</div>
              <div className="text-sm text-slate-300 leading-relaxed bg-black/30 p-3 rounded border border-white/5">
                [This is a mock chunk display. In a full implementation, this would fetch the exact chunk text from the backend using the UUID.]
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
