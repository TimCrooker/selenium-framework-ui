'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Bot, Run } from '../../../types'
import Link from 'next/link'
import apiClient from '@/utils/apiClient'
import socket from '@/utils/socket'
import { useRouter } from 'next/navigation'
import {
	Container,
	Typography,
	Button,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	TextField,
	Grid,
} from '@mui/material'
import moment from 'moment'
import cronstrue from 'cronstrue'

const BotDetails: React.FC = () => {
	const router = useRouter()
	const params = useParams()
	const botId = params.botId
	const [bot, setBot] = useState<Bot | null>(null)
	const [runs, setRuns] = useState<Run[]>([])
	const [order, setOrder] = useState<'asc' | 'desc'>('desc') // Default to most recent runs at the top
	const [orderBy, setOrderBy] = useState<keyof Run>('start_time')
	const [isEditing, setIsEditing] = useState(false)
	const [updatedBot, setUpdatedBot] = useState<Partial<Bot>>({})

	const handleRequestSort = (property: keyof Run) => {
		const isAsc = orderBy === property && order === 'asc'
		setOrder(isAsc ? 'desc' : 'asc')
		setOrderBy(property)
	}

	const sortedRuns = runs.slice().sort((a, b) => {
		if (orderBy === 'start_time' || orderBy === 'end_time') {
			return (
				(order === 'asc' ? 1 : -1) *
				(new Date(a[orderBy] || '').getTime() -
					new Date(b[orderBy] || '').getTime())
			)
		}
		return (
			(order === 'asc' ? 1 : -1) *
			((a[orderBy] || '') < (b[orderBy] || '') ? -1 : 1)
		)
	})

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'green'
			case 'error':
				return 'red'
			case 'running':
				return 'blue'
			case 'starting':
				return 'orange'
			case 'queued':
				return 'purple'
			default:
				return 'grey'
		}
	}

	const computeDuration = (start_time?: string, end_time?: string) => {
		if (!start_time || !end_time) return 'N/A'
		const start = moment(start_time)
		const end = moment(end_time)
		const duration = moment.duration(end.diff(start))
		const hours = duration.hours()
		const minutes = duration.minutes()
		const seconds = duration.seconds()
		return [
			hours ? `${hours}h` : '',
			minutes ? `${minutes}m` : '',
			seconds ? `${seconds}s` : '',
		]
			.filter(Boolean)
			.join(' ')
	}

	useEffect(() => {
		if (!botId) return

		const fetchBotDetails = async () => {
			try {
				const botResponse = await apiClient.get<Bot>(`/bots/${botId}`)
				setBot(botResponse.data)

				const runsResponse = await apiClient.get<Run[]>(`/bots/${botId}/runs`)
				setRuns(runsResponse.data)
			} catch (error) {
				console.error('Error fetching bot details:', error)
			}
		}

		fetchBotDetails()

		// Subscribe to bot status updates
		socket.emit('join', { bot_id: botId })

		// Listen for bot deletion
		socket.on('bot_deleted', (data) => {
			console.log('bot_deleted', data)
			if (data.bot_id === botId) {
				alert('This bot has been deleted.')
				router.push('/bots')
			}
		})

		socket.on('run_created', (data) => {
			console.log('run_created', data)
			if (data.bot_id === botId) {
				setRuns((prevRuns) => [...prevRuns, data])
			}
		})

		socket.on('run_updated', (data) => {
			console.log('run_updated', data)
			if (data.bot_id === botId) {
				setRuns((prevRuns) =>
					prevRuns.map((run) => (run._id === data._id ? data : run))
				)
			}
		})

		return () => {
			socket.emit('leave', { bot_id: botId })
			socket.off('bot_deleted')
			socket.off('run_created')
			socket.off('run_updated')
		}
	}, [botId])

	const handleRunBot = async () => {
		try {
			await apiClient.post(`/bots/${botId}/runs`)
		} catch (error) {
			console.error('Error running bot:', error)
		}
	}

	const handleDeleteBot = async () => {
		if (
			confirm(
				'Are you sure you want to delete this bot? This action cannot be undone.'
			)
		) {
			try {
				await apiClient.delete(`/bots/${botId}`)
				alert('Bot deleted successfully.')
				router.push('/bots')
			} catch (error) {
				console.error('Error deleting bot:', error)
				alert('Failed to delete bot. Please try again.')
			}
		}
	}

	const handleEditBot = () => {
		setIsEditing(true)
		setUpdatedBot(bot || {})
	}

	const handleSaveBot = async () => {
		try {
			await apiClient.put(`/bots/${botId}`, updatedBot)
			setBot({ ...bot, ...updatedBot } as Bot)
			setIsEditing(false)
		} catch (error) {
			console.error('Error updating bot:', error)
			alert('Failed to update bot. Please try again.')
		}
	}

	const handleCancelEdit = () => {
		setIsEditing(false)
		setUpdatedBot({})
	}

	if (!bot) return <div>Loading...</div>

	return (
		<Container>
			<Typography variant="h4" gutterBottom>
				Bot Details: {bot.name}
			</Typography>
			<Paper elevation={3} style={{ padding: '1em' }}>
				{isEditing ? (
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<TextField
								label="Name"
								fullWidth
								value={updatedBot.name || ''}
								onChange={(e) =>
									setUpdatedBot({ ...updatedBot, name: e.target.value })
								}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Script"
								fullWidth
								value={updatedBot.script || ''}
								onChange={(e) =>
									setUpdatedBot({ ...updatedBot, script: e.target.value })
								}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Schedule"
								fullWidth
								value={updatedBot.schedule || ''}
								onChange={(e) =>
									setUpdatedBot({ ...updatedBot, schedule: e.target.value })
								}
							/>
						</Grid>
					</Grid>
				) : (
					<>
						<Typography variant="body1">Name: {bot.name}</Typography>
						<Typography variant="body1">Script: {bot.script}</Typography>
						<Typography variant="body1">
							Schedule:{' '}
							{bot.schedule
								? cronstrue.toString(bot.schedule)
								: 'Not scheduled'}
						</Typography>
					</>
				)}
			</Paper>

			{isEditing ? (
				<>
					<Button
						variant="contained"
						color="primary"
						onClick={handleSaveBot}
						style={{ marginTop: '1em' }}
					>
						Save
					</Button>
					<Button
						variant="contained"
						onClick={handleCancelEdit}
						style={{ marginLeft: '10px', marginTop: '1em' }}
					>
						Cancel
					</Button>
				</>
			) : (
				<>
					<Button
						variant="contained"
						color="primary"
						onClick={handleRunBot}
						style={{ marginTop: '1em' }}
					>
						Run Bot
					</Button>
					<Button
						variant="contained"
						color="secondary"
						onClick={handleDeleteBot}
						style={{ marginLeft: '10px', marginTop: '1em' }}
					>
						Delete Bot
					</Button>
					<Button
						variant="contained"
						onClick={handleEditBot}
						style={{ marginLeft: '10px', marginTop: '1em' }}
					>
						Edit Bot
					</Button>
				</>
			)}

			<Typography variant="h5" gutterBottom style={{ marginTop: '1em' }}>
				Runs
			</Typography>
			<Paper elevation={3} style={{ padding: '1em' }}>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>
									<TableSortLabel
										active={orderBy === '_id'}
										direction={orderBy === '_id' ? order : 'asc'}
										onClick={() => handleRequestSort('_id')}
									>
										Run ID
									</TableSortLabel>
								</TableCell>
								<TableCell>
									<TableSortLabel
										active={orderBy === 'status'}
										direction={orderBy === 'status' ? order : 'asc'}
										onClick={() => handleRequestSort('status')}
									>
										Status
									</TableSortLabel>
								</TableCell>
								<TableCell>
									<TableSortLabel
										active={orderBy === 'start_time'}
										direction={orderBy === 'start_time' ? order : 'asc'}
										onClick={() => handleRequestSort('start_time')}
									>
										Start Time
									</TableSortLabel>
								</TableCell>
								<TableCell>
									<TableSortLabel
										active={orderBy === 'end_time'}
										direction={orderBy === 'end_time' ? order : 'asc'}
										onClick={() => handleRequestSort('end_time')}
									>
										End Time
									</TableSortLabel>
								</TableCell>
								<TableCell>Duration</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedRuns.map((run) => (
								<TableRow key={run._id}>
									<TableCell>
										<Link href={`/runs/${run._id}`} passHref>
											{run._id}
										</Link>
									</TableCell>
									<TableCell style={{ color: getStatusColor(run.status) }}>
										{run.status}
									</TableCell>
									<TableCell>
										{run.start_time
											? moment(run.start_time).format('MMMM Do YYYY, h:mm:ss a')
											: 'N/A'}
									</TableCell>
									<TableCell>
										{run.end_time
											? moment(run.end_time).format('MMMM Do YYYY, h:mm:ss a')
											: 'N/A'}
									</TableCell>
									<TableCell>
										{computeDuration(run.start_time, run.end_time)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</Container>
	)
}

export default BotDetails
