'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import socket from '@/utils/socket'
import apiClient from '@/utils/apiClient'
import { Run, RunLog } from '@/types'

const RunDetails: React.FC = () => {
	const params = useParams();
	const runId = params.runId;
	const [run, setRun] = useState<Run | null>(null);
	const [logs, setLogs] = useState<RunLog[]>([]);

	useEffect(() => {
		if (!runId) return;

		const fetchRunDetails = async () => {
			try {
				const runResponse = await apiClient.get<Run>(`/runs/${runId}`);
				setRun(runResponse.data);
			} catch (error) {
				console.error('Error fetching run details:', error);
			}
		};

		const fetchRunLogs = async () => {
			try {
				const logsResponse = await apiClient.get<RunLog[]>(`/runs/${runId}/logs`);
				setLogs(logsResponse.data);
			} catch (error) {
				console.error('Error fetching run logs:', error);
			}
		};

		fetchRunDetails();
		fetchRunLogs();

		// Subscribe to live logs
		socket.emit('join', { run_id: runId });

		// Listen for new logs
		socket.on('run_log_created', (data) => {
			if (data.run_id === runId) {
				setLogs((prevLogs) => [...prevLogs, data.log]);
			}
		});

		// Listen for run updates
		socket.on('run_updated', (data) => {
			if (data.run_id === runId) {
				setRun(data.run);
			}
		});

		return () => {
			socket.emit('leave', { run_id: runId });
			socket.off('run_log_created');
			socket.off('run_updated');
		};
	}, [runId]);

	if (!run) return <div>Loading...</div>;

	return (
		<div>
			<h1>Run Details</h1>
			<p>Run ID: {run.id}</p>
			<p>Status: {run.status}</p>
			<p>Start Time: {run.start_time}</p>
			<p>End Time: {run.end_time}</p>

			<h2>Logs</h2>
			<pre style={{ backgroundColor: '#f0f0f0', padding: '1em' }}>
				{logs.map((log, index) => (
					<div key={index}>
						<p>{log.timestamp}</p>
						<p>{log.message}</p>
						{log.screenshot && <img src={log.screenshot} alt="Screenshot" />}
						{log.payload && <pre>{JSON.stringify(log.payload, null, 2)}</pre>}
					</div>
				))}
			</pre>
		</div>
	);
};

export default RunDetails;
