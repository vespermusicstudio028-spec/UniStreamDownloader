import { useEffect, useRef, useCallback } from 'react';

interface SSEOptions {
  onMessage: (data: any) => void;
  onError?: (err: Event) => void;
}

export function useSSE(url: string | null, options: SSEOptions) {
  const esRef = useRef<EventSource | null>(null);

  const { onMessage, onError } = options;

  const connect = useCallback(() => {
    if (!url) return;
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = (err) => {
      if (onError) onError(err);
      es.close();
    };
  }, [url, onMessage, onError]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  const close = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  return { close };
}
