'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Run } from '../../../../../types';
import socket from '@/utils/socket'
import apiClient from '@/utils/apiClient'

const RunDetails: React.FC = () => {
  const params = useParams();
  const botId = params.botId;
  const runId = params.runId;
  const [run, setRun] = useState<Run | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!botId || !runId) return;

    const fetchRunDetails = async () => {
      try {
        const runResponse = await apiClient.get<Run>(`/bots/${botId}/runs/${runId}`);
        setRun(runResponse.data);
        if (runResponse.data.logs) {
          setLogs(runResponse.data.logs.split('\n'));
        }
      } catch (error) {
        console.error('Error fetching run details:', error);
      }
    };

    fetchRunDetails();

    // Subscribe to live logs
    socket.emit('join', { run_id: runId });

    socket.on('bot_log', (data) => {
      if (data.run_id === runId) {
        setLogs((prevLogs) => [...prevLogs, JSON.stringify(data.event_data)]);
      }
    });

    return () => {
      socket.emit('leave', { run_id: runId });
      socket.off('bot_log');
    };
  }, [botId, runId]);

  if (!run) return <div>Loading...</div>;

  return (
    <div>
      <h1>Run Details</h1>
      <p>Run ID: {run.run_id}</p>
      <p>Status: {run.status}</p>
      <p>Start Time: {run.start_time}</p>
      <p>End Time: {run.end_time || 'Running...'}</p>

      <h2>Logs</h2>
      <pre style={{ backgroundColor: '#f0f0f0', padding: '1em' }}>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </pre>
    </div>
  );
};

export default RunDetails;
