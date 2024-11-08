'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Agent } from '../../../types'
import apiClient from '@/utils/apiClient'
import socket from '@/utils/socket'

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

	if (!agent) return <div>Loading...</div>

	return (
		<div>
			<h1>Agent Details: {agent.agent_id}</h1>
			<p>Status: {agent.status}</p>
			<p>Last Heartbeat: {agent.last_heartbeat || 'N/A'}</p>
			<p>Public URL: {agent.public_url || 'N/A'}</p>
			<p>Resources: {agent.resources ? JSON.stringify(agent.resources) : 'N/A'}</p>

			<h2>Logs</h2>
			<ul>
				{logs.map((log, index) => (
					<li key={index}>{log}</li>
				))}
			</ul>
		</div>
	)
}

export default AgentDetails
