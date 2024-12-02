'use client'

import React, { useEffect, useState } from 'react'
import { Agent } from '../../types'
import Link from 'next/link'
import apiClient from '@/utils/apiClient'
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material'
import moment from 'moment-timezone'

const AgentsList: React.FC = () => {
	const [agents, setAgents] = useState<Agent[]>([])

	useEffect(() => {
		const fetchAgents = async () => {
			try {
				const response = await apiClient.get<Agent[]>('/agents')
				setAgents(response.data)
			} catch (error) {
				console.error('Error fetching agents:', error)
			}
		}

		fetchAgents()
	}, [])

	const formatHeartbeat = (heartbeat?: string) => {
		return heartbeat ? moment.utc(heartbeat).tz(moment.tz.guess()).fromNow() : 'N/A'
	}

	return (
		<Container>
			<Typography variant="h4" gutterBottom>Agents List</Typography>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Agent ID</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Last Heartbeat</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{agents.map((agent) => (
							<TableRow key={agent.agent_id}>
								<TableCell>
									<Link href={`/agents/${agent.agent_id}`} passHref>
										<Typography variant="body1" color="primary">{agent.agent_id}</Typography>
									</Link>
								</TableCell>
								<TableCell>{agent.status}</TableCell>
								<TableCell>{formatHeartbeat(agent.last_heartbeat)}</TableCell>
								<TableCell>
									<Button variant="contained" color="secondary">View Details</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Container>
	)
}

export default AgentsList
