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
	TablePagination,
	Box,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
} from '@mui/material'
import moment from 'moment'
import cronstrue from 'cronstrue'
import { getStatusColor } from '@/utils/statusColor'

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
	const [page, setPage] = useState(0)
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState<string | null>(null)

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

	const filteredRuns = sortedRuns.filter((run) => {
		const matchesSearch = run._id.includes(searchTerm) || run.status.includes(searchTerm)
		const matchesStatus = statusFilter ? run.status === statusFilter : true
		return matchesSearch && matchesStatus
	})

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

	const handleChangePage = (event: unknown, newPage: number) => {
		setPage(newPage)
	}

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10))
		setPage(0)
	}

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value)
		setPage(0)
	}

	const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
		setStatusFilter(event.target.value as string)
		setPage(0)
	}

	if (!bot) return <div>Loading...</div>

	return (
		<Container>
			<Typography variant="h4" gutterBottom>
				Bot Details: {bot.name}
			</Typography>
			<Paper elevation={3} style={{ padding: '2em', marginBottom: '2em' }}>
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
								multiline
								rows={4}
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
					<Box>
						<Typography variant="body1" gutterBottom>
							<strong>Name:</strong> {bot.name}
						</Typography>
						<Typography variant="body1" gutterBottom>
							<strong>Script:</strong> {bot.script}
						</Typography>
						<Typography variant="body1" gutterBottom>
							<strong>Schedule:</strong>{' '}
							{bot.schedule
								? cronstrue.toString(bot.schedule)
								: 'Not scheduled'}
						</Typography>
					</Box>
				)}
			</Paper>

			<Box display="flex" justifyContent="flex-end" mb={2}>
				{isEditing ? (
					<>
						<Button
							variant="contained"
							color="primary"
							onClick={handleSaveBot}
							style={{ marginRight: '10px' }}
						>
							Save
						</Button>
						<Button variant="contained" onClick={handleCancelEdit}>
							Cancel
						</Button>
					</>
				) : (
					<>
						<Button
							variant="contained"
							color="primary"
							onClick={handleRunBot}
							style={{ marginRight: '10px' }}
						>
							Run Bot
						</Button>
						<Button
							variant="contained"
							color="secondary"
							onClick={handleDeleteBot}
							style={{ marginRight: '10px' }}
						>
							Delete Bot
						</Button>
						<Button variant="contained" onClick={handleEditBot}>
							Edit Bot
						</Button>
					</>
				)}
			</Box>

			<Typography variant="h5" gutterBottom>
				Runs
			</Typography>
			<Box display="flex" justifyContent="space-between" mb={2}>
				<TextField
					label="Search"
					variant="outlined"
					value={searchTerm}
					onChange={handleSearchChange}
					style={{ flex: 1, marginRight: '1em' }}
				/>
				<FormControl variant="outlined" style={{ minWidth: 200 }}>
					<InputLabel>Status Filter</InputLabel>
					<Select
						value={statusFilter || ''}
						onChange={handleStatusFilterChange as any}
						label="Status Filter"
					>
						<MenuItem value="">All</MenuItem>
						<MenuItem value="completed">Completed</MenuItem>
						<MenuItem value="error">Error</MenuItem>
						<MenuItem value="running">Running</MenuItem>
						<MenuItem value="starting">Starting</MenuItem>
						<MenuItem value="queued">Queued</MenuItem>
					</Select>
				</FormControl>
			</Box>
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
								<TableCell>Logs</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredRuns
								.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
								.map((run) => (
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
												? moment(run.start_time).format(
														'MMMM Do YYYY, h:mm:ss a'
												  )
												: 'N/A'}
										</TableCell>
										<TableCell>
											{run.end_time
												? moment(run.end_time).format(
														'MMMM Do YYYY, h:mm:ss a'
												  )
												: 'N/A'}
										</TableCell>
										<TableCell>
											{computeDuration(run.start_time, run.end_time)}
										</TableCell>
										<TableCell>
											<Link href={`/runs/${run._id}/logs`} passHref>
												<Button variant="contained" color="primary">
													View Logs
												</Button>
											</Link>
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					rowsPerPageOptions={[5, 10, 25]}
					component="div"
					count={filteredRuns.length}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
				/>
			</Paper>
		</Container>
	)
}

export default BotDetails
