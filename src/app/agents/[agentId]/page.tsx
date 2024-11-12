'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Agent } from '../../../types'
import apiClient from '@/utils/apiClient'
import socket from '@/utils/socket'
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import moment from 'moment-timezone'

const AgentDetails: React.FC = () => {
	const params = useParams()
	const agentId = params.agentId
	const [agent, setAgent] = useState<Agent | null>(null)
	const [logs, setLogs] = useState<string[]>([])

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

		return () => {
			socket.emit('leave', { agent_id: agentId })
			socket.off('agent_updated')
			socket.off('agent_log_created')
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
			<Paper elevation={3} style={{ padding: '1em' }}>
				<TableContainer>
					<Table>
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
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</Container>
	)
}

export default AgentDetails
