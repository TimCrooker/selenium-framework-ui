'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import socket from '@/utils/socket'
import apiClient from '@/utils/apiClient'
import { RunEvent, RunLog } from '@/types'
import {
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
	IconButton,
	Button,
} from '@mui/material'
import Link from 'next/link'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import moment from 'moment'

const RunDetails: React.FC = () => {
	const params = useParams()
	const runId = params.runId
	const [events, setEvents] = useState<RunEvent[]>([])
	const [order, setOrder] = useState<'asc' | 'desc'>('asc')
	const [orderBy, setOrderBy] = useState<keyof RunLog>('timestamp')
	const [open, setOpen] = useState(false)
	const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
		null
	)
	const [currentImageIndex, setCurrentImageIndex] = useState(events.length - 1)

	const handleOpen = (screenshot: string) => {
		setSelectedScreenshot(screenshot)
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
		setSelectedScreenshot(null)
	}

	useEffect(() => {
		if (!runId) return

		const fetchRunEvents = async () => {
			try {
				const response = await apiClient.get<RunEvent[]>(`/runs/${runId}/events`)
				setEvents(response.data)
			} catch (error) {
				console.error('Error fetching run events:', error)
			}
		}

		fetchRunEvents()

		// Subscribe to live events
		socket.emit('join', { run_id: runId })

		// Listen for new events
		socket.on('run_event', (data) => {
			if (data.run_id === runId) {
				setEvents((prevEvents) => [...prevEvents, data])
			}
		})

		return () => {
			socket.emit('leave', { run_id: runId })
			socket.off('run_event')
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

	const handleNextImage = () => {
		setCurrentImageIndex((prevIndex) => Math.min(prevIndex + 1, events.length - 1))
	}

	const handlePrevImage = () => {
		setCurrentImageIndex((prevIndex) => Math.max(prevIndex - 1, 0))
	}

	const currentImage = useMemo(() => {
		const eventWithScreenshot = events[currentImageIndex]
		return eventWithScreenshot ? eventWithScreenshot.screenshot : null
	}, [events, currentImageIndex])

	useEffect(() => {
		setCurrentImageIndex(events.length - 1)
	}, [events])

	return (
		<>
			<Link href={`/runs/${runId}/logs`} passHref>
				<Button variant="contained" color="primary" style={{ marginBottom: '1em' }}>
					View Logs
				</Button>
			</Link>
			{currentImage && (
				<Paper elevation={3} style={{ padding: '1em', marginBottom: '1em', textAlign: 'center' }}>
					<Box position="relative">
						<IconButton
							onClick={handlePrevImage}
							disabled={currentImageIndex === 0}
							style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
						>
							<ArrowBackIcon />
						</IconButton>
						<img
							src={isBase64(currentImage) ? `data:image/png;base64,${currentImage}` : currentImage}
							alt="Current Screenshot"
							style={{ width: '100%', height: 'auto' }}
							/>
						<IconButton
							onClick={handleNextImage}
							disabled={currentImageIndex === events.length - 1}
							style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
						>
							<ArrowForwardIcon />
						</IconButton>
					</Box>
				</Paper>
			)}

			<Grid container spacing={2}>
				<Grid item>
					<Typography variant="h5" gutterBottom>
						Events ({events.length})
					</Typography>
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
				</Grid>
			</Grid>

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
		</>
	)
}

export default RunDetails
