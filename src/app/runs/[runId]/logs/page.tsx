'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import socket from '@/utils/socket'
import apiClient from '@/utils/apiClient'
import { RunLog, LogLevel } from '@/types'
import {
	TextField,
	Select,
	MenuItem,
	InputLabel,
	FormControl,
	IconButton,
	Box,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import moment from 'moment'

const RunLogsPage: React.FC = () => {
	const params = useParams()
	const runId = params.runId
	const [logs, setLogs] = useState<RunLog[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [filterLevel, setFilterLevel] = useState<LogLevel | ''>('')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [order, setOrder] = useState<'asc' | 'desc'>('asc')
	const [orderBy, setOrderBy] = useState<keyof RunLog>('timestamp')

	const handleRequestSort = (property: keyof RunLog) => {
		const isAsc = orderBy === property && order === 'asc'
		setOrder(isAsc ? 'desc' : 'asc')
		setOrderBy(property)
	}

	const sortedLogs = useMemo(() => {
		return [...logs].sort((a, b) => {
			if (orderBy === 'timestamp') {
				return order === 'asc'
					? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
					: new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			} else if (orderBy === 'level') {
				return order === 'asc'
					? a.level.localeCompare(b.level)
					: b.level.localeCompare(a.level)
			} else if (orderBy === 'message') {
				return order === 'asc'
					? a.message.localeCompare(b.message)
					: b.message.localeCompare(a.message)
			} else {
				return 0
			}
		})
	}, [logs, order, orderBy])

	const filteredLogs = sortedLogs
		.filter((log) =>
			log.message.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.filter((log) => (filterLevel ? log.level === filterLevel : true))

	useEffect(() => {
		if (!runId) return

		const fetchRunLogs = async () => {
			try {
				const response = await apiClient.get<RunLog[]>(`/runs/${runId}/logs`)
				setLogs(response.data)
			} catch (error) {
				console.error('Error fetching run logs:', error)
			}
		}

		fetchRunLogs()

		// Subscribe to live logs
		socket.emit('join', { run_id: runId })

		// Listen for new logs
		socket.on('run_log', (data) => {
			if (data.run_id === runId) {
				setLogs((prevLogs) => [...prevLogs, data])
			}
		})

		return () => {
			socket.emit('leave', { run_id: runId })
			socket.off('run_log')
		}
	}, [runId])

	return (
		<>
			<Typography variant="h4" gutterBottom>
				Run Logs
			</Typography>
			<Paper elevation={3} style={{ padding: '1em', marginBottom: '1em' }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
					<FormControl variant="outlined" style={{ minWidth: 200 }}>
						<TextField
							label="Search"
							variant="outlined"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							InputProps={{
								endAdornment: (
									<IconButton>
										<SearchIcon />
									</IconButton>
								),
							}}
						/>
					</FormControl>
					<FormControl variant="outlined" style={{ minWidth: 200 }}>
						<InputLabel>Filter by Level</InputLabel>
						<Select
							value={filterLevel}
							onChange={(e) => setFilterLevel(e.target.value as LogLevel)}
							label="Filter by Level"
						>
							<MenuItem value="">
								<em>None</em>
							</MenuItem>
							{Object.values(LogLevel).map((level) => (
								<MenuItem key={level} value={level}>
									{level}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl variant="outlined" style={{ minWidth: 200 }}>
						<InputLabel>Sort Order</InputLabel>
						<Select
							value={sortOrder}
							onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
							label="Sort Order"
						>
							<MenuItem value="asc">Ascending</MenuItem>
							<MenuItem value="desc">Descending</MenuItem>
						</Select>
					</FormControl>
				</Box>
				<TableContainer component={Paper}>
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
								<TableCell>
									<TableSortLabel
										active={orderBy === 'level'}
										direction={orderBy === 'level' ? order : 'asc'}
										onClick={() => handleRequestSort('level')}
									>
										Level
									</TableSortLabel>
								</TableCell>
								<TableCell>
									<TableSortLabel
										active={orderBy === 'message'}
										direction={orderBy === 'message' ? order : 'asc'}
										onClick={() => handleRequestSort('message')}
									>
										Message
									</TableSortLabel>
								</TableCell>
								<TableCell>Payload</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredLogs.map((log) => (
								<TableRow key={log._id}>
									<TableCell>{moment(log.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</TableCell>
									<TableCell>{log.level}</TableCell>
									<TableCell>{log.message}</TableCell>
									<TableCell>
										{log.payload && <pre>{JSON.stringify(log.payload, null, 2)}</pre>}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</>
	)
}

export default RunLogsPage
