import React, { useEffect, useRef, useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControlLabel, Checkbox } from '@mui/material';

interface LogViewerProps {
	logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
	const [autoScroll, setAutoScroll] = useState(true);
	const logsEndRef = useRef<HTMLTableRowElement | null>(null);

	useEffect(() => {
		if (autoScroll && logsEndRef.current) {
			logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [logs, autoScroll]);

	return (
		<Paper elevation={3} style={{ padding: '1em' }}>
			<FormControlLabel
				control={<Checkbox checked={autoScroll} onChange={() => setAutoScroll(!autoScroll)} />}
				label="Auto Scroll"
			/>
			<TableContainer style={{ maxHeight: '400px', overflowY: 'auto' }}>
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell>Log</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{logs.map((log, index) => (
							<TableRow key={index}>
								<TableCell>{log}</TableCell>
							</TableRow>
						))}
						<TableRow ref={logsEndRef} />
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};

export default LogViewer;