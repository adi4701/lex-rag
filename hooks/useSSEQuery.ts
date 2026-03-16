import { useState, useCallback } from 'react';

export function useSSEQuery() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokens, setTokens] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sendQuery = useCallback(async (query: string, sessionId: string, accessToken: string, docTypes?: string[]) => {
    setIsStreaming(true);
    setTokens('');
    setMetadata(null);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query, session_id: sessionId, doc_types: docTypes })
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const event = JSON.parse(line.slice(6));
            
            if (event.type === 'token') {
              setTokens(prev => prev + event.content);
            } else if (event.type === 'correction') {
              setTokens(prev => prev.replace(event.original, event.replacement));
            } else if (event.type === 'cache_hit') {
              setTokens(event.content);
            } else if (event.type === 'done') {
              setMetadata(event);
              setIsStreaming(false);
            } else if (event.type === 'error') {
              setError(event.message);
              setIsStreaming(false);
            }
          } catch (e) {
            console.error("Error parsing SSE event:", e, line);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      setIsStreaming(false);
    }
  }, []);

  return { sendQuery, isStreaming, tokens, metadata, error };
}
