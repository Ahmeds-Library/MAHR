import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/store';
import { flyRealHandoffEnvelope } from '../store/realAgentEvents';

export interface OfficeStreamOptions {
  onTaskUpdate?: (task: any) => void;
  onTerminalLog?: (log: any) => void;
  onStateUpdate?: (state: any) => void;
  onAgentTaskComplete?: (data: any) => void;
}

export function useOfficeStream(options: OfficeStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      try {
        es = new EventSource('/api/office/stream');

        es.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
        };

        es.addEventListener('connected', () => {
          if (!isMounted) return;
          setIsConnected(true);
          setLastEventTime(Date.now());
        });

        es.addEventListener('ping', () => {
          if (!isMounted) return;
          setLastEventTime(Date.now());
        });

        // 1. Full State Update
        es.addEventListener('state-update', (e) => {
          if (!isMounted) return;
          try {
            const state = JSON.parse(e.data);
            optionsRef.current.onStateUpdate?.(state);
            setLastEventTime(Date.now());
          } catch (_) {}
        });

        // 2. Real-Time Status Change (Thinking -> Working -> Done -> Idle)
        es.addEventListener('agent-status-change', (e) => {
          if (!isMounted) return;
          try {
            const change = JSON.parse(e.data);
            const rawId = change.memberId || change.id;
            if (!rawId) return;

            const { agents, updateAgent } = useStore.getState();
            const cleanId = rawId.toLowerCase().replace(/^(agent[-_]?)/, '');
            const target = agents.find((a) => {
              const aClean = a.id.toLowerCase().replace(/^(agent[-_]?)/, '');
              return a.id === rawId || aClean === cleanId || a.name.toLowerCase() === cleanId;
            });

            if (target) {
              updateAgent(target.id, {
                status: change.status || 'idle',
                action: change.action || change.thoughtBubble || target.action,
                thoughtBubble: change.thoughtBubble,
                toolBubble: change.toolBubble,
                currentTask: change.currentTask,
                recentTextTs: Date.now()
              });
            }
            setLastEventTime(Date.now());
          } catch (_) {}
        });

        // 3. Agent Task Complete
        es.addEventListener('agent-task-complete', (e) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(e.data);
            const rawId = data.memberId || data.id;
            if (rawId) {
              const { agents, updateAgent } = useStore.getState();
              const cleanId = rawId.toLowerCase().replace(/^(agent[-_]?)/, '');
              const target = agents.find((a) => {
                const aClean = a.id.toLowerCase().replace(/^(agent[-_]?)/, '');
                return a.id === rawId || aClean === cleanId || a.name.toLowerCase() === cleanId;
              });

              if (target) {
                updateAgent(target.id, {
                  status: data.status || 'idle',
                  thoughtBubble: data.thoughtBubble || `✅ Done: ${data.result?.slice(0, 45) || 'Task complete'}`,
                  toolBubble: undefined,
                  action: `Completed: "${data.result?.slice(0, 30) || 'Task'}"`,
                  recentTextTs: Date.now()
                });
              }
            }
            optionsRef.current.onAgentTaskComplete?.(data);
            setLastEventTime(Date.now());
          } catch (_) {}
        });

        // 4. Desk-to-Desk Message Envelope Flight (Munder Difflin core feature)
        es.addEventListener('envelope-fly', (e) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(e.data);
            if (data && data.from && data.to) {
              flyRealHandoffEnvelope(data.from, data.to, data.act || 'request');
            }
            setLastEventTime(Date.now());
          } catch (_) {}
        });

        // 5. Kanban Task Update
        es.addEventListener('task-update', (e) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(e.data);
            if (payload && payload.task) {
              optionsRef.current.onTaskUpdate?.(payload.task);
            }
            setLastEventTime(Date.now());
          } catch (_) {}
        });

        // 6. Terminal Console Log
        es.addEventListener('terminal-log', (e) => {
          if (!isMounted) return;
          try {
            const log = JSON.parse(e.data);
            if (log && log.text) {
              optionsRef.current.onTerminalLog?.(log);
            }
            setLastEventTime(Date.now());
          } catch (_) {}
        });

        es.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
          es?.close();
          es = null;
          // Reconnect with 4s backoff
          reconnectTimeout = setTimeout(connect, 4000);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) {
        es.close();
        es = null;
      }
    };
  }, []);

  return { isConnected, lastEventTime };
}
