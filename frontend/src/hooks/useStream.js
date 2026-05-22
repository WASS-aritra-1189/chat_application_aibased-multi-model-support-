import { useState, useRef, useCallback } from 'react';
import { saveMessages } from '../utils/api';

export function useStream() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (sessionId, userContent, onDelta, onDone, onError) => {
    setStreaming(true);
    let fullResponse = '';
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/conversations/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userContent }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { delta } = JSON.parse(data);
            if (delta) {
              fullResponse += delta;
              onDelta(delta);
            }
          } catch {}
        }
      }

      await saveMessages(sessionId, { userContent, assistantContent: fullResponse });
      onDone(fullResponse);
    } catch (err) {
      if (err.name !== 'AbortError') onError(err.message);
    } finally {
      setStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { streaming, sendMessage, cancel };
}
