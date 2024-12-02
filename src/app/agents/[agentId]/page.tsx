'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Agent, Run } from '../../../types'
import apiClient from '@/utils/apiClient'
import socket from '@/utils/socket'
import { Container, Typography, Paper, Grid, List, ListItem, ListItemText, Divider } from '@mui/material'
import moment from 'moment-timezone'
import LogViewer from '@/components/LogViewer'
import Link from 'next/link'

const AgentDetails: React.FC = () => {
	const params = useParams()
	const agentId = params.agentId
	const [agent, setAgent] = useState<Agent | null>(null)
	const [logs, setLogs] = useState<string[]>([])
	const [runningRuns, setRunningRuns] = useState<Run[]>([])
	const [pastRuns, setPastRuns] = useState<Run[]>([])

	useEffect(() => {
		if (!agentId) return

		const fetchAgentDetails = async () => {
			try {
				const agentResponse = await apiClient.get<Agent>(`/agents/${agentId}`)
				setAgent(agentResponse.data)
			} catch (error) {
				console.error('Error fetching agent details:', error)
			}
		}

		fetchAgentDetails()

		const fetchAgentRuns = async () => {
			try {
				const runsResponse = await apiClient.get<Run[]>(`/agents/${agentId}/runs`)
				const currentRuns = runsResponse.data.filter(run => run.status === 'running')
				const historicalRuns = runsResponse.data.filter(run => run.status !== 'running')
				setRunningRuns(currentRuns)
				setPastRuns(historicalRuns)
			} catch (error) {
				console.error('Error fetching agent runs:', error)
			}
		}

		fetchAgentRuns()

		// Subscribe to agent status updates
		socket.emit('join', { agent_id: agentId })

		// Listen for agent updates
		socket.on('agent_updated', (data) => {
			console.log('agent_updated', data)
			if (data.agent_id === agentId) {
				setAgent(data)
			}
		})

		// Listen for agent logs
		socket.on('agent_log_created', (data) => {
			console.log('agent_log', data)
			if (data.agent_id === agentId) {
				setLogs((prevLogs) => [...prevLogs, data.log])
			}
		})

		socket.on('run_updated', (data) => {
			if (data.agent_id === agentId) {
				setRunningRuns((prevRuns) => prevRuns.filter(run => run._id !== data._id))
				setPastRuns((prevRuns) => [data, ...prevRuns])
			}
		})

		return () => {
			socket.emit('leave', { agent_id: agentId })
			socket.off('agent_updated')
			socket.off('agent_log_created')
			socket.off('run_updated')
		}
	}, [agentId])

	const formatHeartbeat = (heartbeat?: string) => {
		return heartbeat ? moment.utc(heartbeat).tz(moment.tz.guess()).fromNow() : 'N/A'
	}

	if (!agent) return <div>Loading...</div>

	return (
		<Container>
			<Typography variant="h4" gutterBottom>Agent Details: {agent.agent_id}</Typography>
			<Paper elevation={3} style={{ padding: '1em' }}>
				<Typography variant="body1">Status: {agent.status}</Typography>
				<Typography variant="body1">Last Heartbeat: {formatHeartbeat(agent.last_heartbeat)}</Typography>
				<Typography variant="body1">Public URL: {agent.public_url || 'N/A'}</Typography>
				<Typography variant="body1">Resources: {agent.resources ? JSON.stringify(agent.resources) : 'N/A'}</Typography>
			</Paper>

			<Typography variant="h5" gutterBottom style={{ marginTop: '1em' }}>Logs</Typography>
			<LogViewer logs={logs} />

			<Grid container spacing={2} style={{ marginTop: '1em' }}>
				<Grid item xs={8}>
					<Typography variant="h5" gutterBottom>Currently Running Runs</Typography>
					<Paper elevation={3} style={{ padding: '1em' }}>
						<List>
							{runningRuns.map(run => (
								<Link href={`/runs/${run._id}`} passHref key={run._id}>
									<ListItem component="a">
										<ListItemText primary={`Run ID: ${run._id}`} secondary={`Status: ${run.status}`} />
									</ListItem>
								</Link>
							))}
						</List>
					</Paper>
				</Grid>
				<Grid item xs={4}>
					<Typography variant="h5" gutterBottom>Past Runs</Typography>
					<Paper elevation={3} style={{ padding: '1em', maxHeight: '400px', overflow: 'auto' }}>
						<List>
							{pastRuns.map(run => (
								<React.Fragment key={run._id}>
									<Link href={`/runs/${run._id}`} passHref>
										<ListItem component="a">
											<ListItemText primary={`Run ID: ${run._id}`} secondary={`Status: ${run.status}`} />
										</ListItem>
									</Link>
									<Divider />
								</React.Fragment>
							))}
						</List>
					</Paper>
				</Grid>
			</Grid>
		</Container>
	)
}

export default AgentDetails
