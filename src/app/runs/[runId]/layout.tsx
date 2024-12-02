'use client'

import { Run } from "@/types"
import apiClient from "@/utils/apiClient"
import socket from "@/utils/socket"
import { Typography, Paper, Grid, Container } from "@mui/material"
import moment from "moment"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function RunLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { runId } = useParams()

	const [run, setRun] = useState<Run | null>(null)

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

		fetchRunDetails()

		// Subscribe to live events
		socket.emit('join', { run_id: runId })

		// Listen for run updates
		socket.on('run_updated', (data) => {
			if (data.run_id === runId) {
				setRun(data.run)
			}
		})

		return () => {
			socket.emit('leave', { run_id: runId })
			socket.off('run_updated')
		}
	}, [runId])

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
			{children}
		</Container>
	)
}

const computeDuration = (start: string | undefined, end: string | undefined) => {
	if (!start || !end) return 'N/A'
	const startTime = moment(start)
	const endTime = moment(end)
	return moment.duration(endTime.diff(startTime)).humanize()
}