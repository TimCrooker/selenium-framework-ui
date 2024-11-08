'use client'

import React, { useEffect, useState } from 'react'
import { Agent } from '../../types'
import Link from 'next/link'
import apiClient from '@/utils/apiClient'

const AgentsList: React.FC = () => {
	const [agents, setAgents] = useState<Agent[]>([])

	useEffect(() => {
		const fetchAgents = async () => {
			try {
				const response = await apiClient.get<{ agents: Agent[] }>('/agents')
				setAgents(response.data?.agents)
			} catch (error) {
				console.error('Error fetching agents:', error)
			}
		}

		fetchAgents()
	}, [])

	return (
		<div>
			<h1>Agents List</h1>
			<ul>
				{agents.map((agent) => (
					<li key={agent.agent_id}>
						<Link href={`/agents/${agent.agent_id}`}>
							{agent.agent_id} - {agent.status} - {agent.last_heartbeat}
						</Link>
					</li>
				))}
			</ul>
		</div>
	)
}

export default AgentsList
