'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import socket from '@/utils/socket'
import apiClient from '@/utils/apiClient'
import { Run, RunEvent, RunLog } from '@/types'
import {
	Container,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	Modal,
	Box,
	Grid,
} from '@mui/material'
import moment from 'moment'
import LogViewer from '@/components/LogViewer'

const RunDetails: React.FC = () => {
	const params = useParams()
	const runId = params.runId
	const [run, setRun] = useState<Run | null>(null)
	const [logs, setLogs] = useState<RunLog[]>([])
	const [events, setEvents] = useState<RunEvent[]>([])
	const [order, setOrder] = useState<'asc' | 'desc'>('asc')
	const [orderBy, setOrderBy] = useState<keyof RunLog>('timestamp')
	const [open, setOpen] = useState(false)
	const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
		null
	)

	const handleOpen = (screenshot: string) => {
		setSelectedScreenshot(screenshot)
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
		setSelectedScreenshot(null)
	}

	const computeDuration = (
		start: string | undefined,
		end: string | undefined
	) => {
		if (!start || !end) return 'N/A'
		const startTime = moment(start)
		const endTime = moment(end)
		return moment.duration(endTime.diff(startTime)).humanize()
	}

	useEffect(() => {
		if (!runId) return

		const fetchRunDetails = async () => {
			try {
				const runResponse = await apiClient.get<Run>(`/runs/${runId}`)
				setRun(runResponse.data)
			} catch (error) {
				console.error('Error fetching run details:', error)
			}
		}

		const fetchRunLogs = async () => {
			try {
				const response = await apiClient.get<RunLog[]>(
					`/runs/${runId}/logs`
				)
				setLogs(response.data)
			} catch (error) {
				console.error('Error fetching run logs:', error)
			}
		}

		const fetchRunEvents = async () => {
			try {
				const response = await apiClient.get<RunEvent[]>(
					`/runs/${runId}/events`
				)
				setEvents(response.data)
			} catch (error) {
				console.error('Error fetching run logs:', error)
			}
		}

		fetchRunDetails()
		fetchRunLogs()
		fetchRunEvents()

		// Subscribe to live logs
		socket.emit('join', { run_id: runId })

		// Listen for new logs
		socket.on('run_event_created', (data) => {
			if (data.run_id === runId) {
				setLogs((prevLogs) => [...prevLogs, data])
			}
		})

		// Listen for run updates
		socket.on('run_updated', (data) => {
			if (data.run_id === runId) {
				setRun(data.run)
			}
		})

		return () => {
			socket.emit('leave', { run_id: runId })
			socket.off('run_event_created')
			socket.off('run_updated')
		}
	}, [runId])

	const handleRequestSort = (property: keyof RunLog) => {
		const isAsc = orderBy === property && order === 'asc'
		setOrder(isAsc ? 'desc' : 'asc')
		setOrderBy(property)
	}

	const isBase64 = (str: string) => {
		try {
			return btoa(atob(str)) === str
		} catch (err: any) {
			console.log(err)
			return false
		}
	}

	if (!run) return <div>Loading...</div>

	return (
		<Container>
			<Typography variant="h4" gutterBottom>
				Run Details
			</Typography>
			<Paper elevation={3} style={{ padding: '1em', marginBottom: '1em' }}>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6}>
						<Typography variant="body1">
							<strong>Run ID:</strong> {run._id}
						</Typography>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Typography variant="body1">
							<strong>Status:</strong> {run.status}
						</Typography>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Typography variant="body1">
							<strong>Start Time:</strong>{' '}
							{run.start_time
								? moment(run.start_time).format('MMMM Do YYYY, h:mm:ss a')
								: 'N/A'}
						</Typography>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Typography variant="body1">
							<strong>End Time:</strong>{' '}
							{run.end_time
								? moment(run.end_time).format('MMMM Do YYYY, h:mm:ss a')
								: 'N/A'}
						</Typography>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Typography variant="body1">
							<strong>Duration:</strong>{' '}
							{computeDuration(run.start_time, run.end_time)}
						</Typography>
					</Grid>
				</Grid>
			</Paper>

			<Typography variant="h5" gutterBottom>
				Events ({logs.length})
			</Typography>

			<LogViewer
				logs={logs.map(
					(log) =>
						`${moment(log.timestamp).format('MMMM Do YYYY, h:mm:ss a')} - ${
							log.message
						}`
				)}
			/>

			<Paper elevation={3} style={{ padding: '1em' }}>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>
									<TableSortLabel
										active={orderBy === 'timestamp'}
										direction={orderBy === 'timestamp' ? order : 'asc'}
										onClick={() => handleRequestSort('timestamp')}
									>
										Timestamp
									</TableSortLabel>
								</TableCell>
								<TableCell>Message</TableCell>
								<TableCell>Screenshot</TableCell>
								<TableCell>Payload</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{events.map((event, index) => (
								<TableRow key={index}>
									<TableCell>
										{moment(event.timestamp).format('MMMM Do YYYY, h:mm:ss a')}
									</TableCell>
									<TableCell>{event.message}</TableCell>
									<TableCell>
										{event.screenshot && (
											<img
												src={
													isBase64(event.screenshot)
														? `data:image/png;base64,${event.screenshot}`
														: event.screenshot
												}
												alt="Screenshot"
												style={{
													maxWidth: '100px',
													height: 'auto',
													cursor: 'pointer',
												}}
												onClick={() => handleOpen(event.screenshot!)}
											/>
										)}
									</TableCell>
									<TableCell>
										{event.payload && (
											<pre>{JSON.stringify(event.payload, null, 2)}</pre>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
			<Modal open={open} onClose={handleClose}>
				<Box
					sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						bgcolor: 'background.paper',
						boxShadow: 24,
						p: 4,
					}}
				>
					{selectedScreenshot && (
						<img
							src={
								isBase64(selectedScreenshot)
									? `data:image/png;base64,${selectedScreenshot}`
									: selectedScreenshot
							}
							alt="Screenshot"
							style={{ width: '100%', height: 'auto' }}
						/>
					)}
				</Box>
			</Modal>
		</Container>
	)
}

export default RunDetails
