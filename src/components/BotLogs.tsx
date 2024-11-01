import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

interface BotLogsProps {
  runId: string;
}

const BotLogs: React.FC<BotLogsProps> = ({ runId }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const socket = useSocket('http://localhost:8000');

  useEffect(() => {
    socket.emit('join', { run_id: runId });

    socket.on('bot_log', (message: { run_id: string; event_data: any }) => {
      if (message.run_id === runId) {
        setLogs((prevLogs) => [...prevLogs, JSON.stringify(message.event_data)]);
      }
    });

    return () => {
      socket.emit('leave', { run_id: runId });
      socket.off('bot_log');
    };
  }, [socket, runId]);

  return (
    <div>
      <h2>Logs for Run {runId}</h2>
      <pre>{logs.join('\n')}</pre>
    </div>
  );
};

export default BotLogs;
