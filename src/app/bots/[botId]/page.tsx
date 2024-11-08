'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Bot, Run } from '../../../types'
import Link from 'next/link'
import apiClient from '@/utils/apiClient'
import socket from '@/utils/socket'
import { useRouter } from 'next/navigation'

const BotDetails: React.FC = () => {
	const router = useRouter()
	const params = useParams()
	const botId = params.botId
	const [bot, setBot] = useState<Bot | null>(null)
	const [runs, setRuns] = useState<Run[]>([])

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
			if (data.bot_id === botId) {
				alert('This bot has been deleted.')
				router.push('/bots')
			}
		})

		socket.on('run_created', (data) => {
			if (data.bot_id === botId) {
				setRuns((prevRuns) => [...prevRuns, data])
			}
		})

		socket.on('run_updated', (data) => {
			const updatedRunIndex = runs.findIndex((run) => run.id === data.id)
			if (updatedRunIndex > -1) {
				setRuns((prevRuns) => {
					const newRuns = [...prevRuns]
					newRuns[updatedRunIndex] = data
					return newRuns
				})
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

	// const handleStopBot = async () => {
	// 	try {
	// 		await apiClient.post(`/bots/${botId}/stop`)
	// 		setIsRunning(false)
	// 	} catch (error) {
	// 		console.error('Error stopping bot:', error)
	// 	}
	// }

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

	if (!bot) return <div>Loading...</div>

	return (
		<div>
			<h1>Bot Details: {bot.name}</h1>
			<p>Script: {bot.script}</p>
			<p>Schedule: {bot.schedule || 'Not scheduled'}</p>

			{/* {!isRunning ? (
				<button onClick={handleRunBot}>Run Bot</button>
			) : (
				<button onClick={handleStopBot}>Stop Bot</button>
			)} */}
			<button onClick={handleRunBot}>Run Bot</button>

			<button
				onClick={handleDeleteBot}
				style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}
			>
				Delete Bot
			</button>

			<h2>Runs</h2>
			<ul>
				{runs.map((run) => (
					<li key={run.id}>
						<Link href={`/runs/${run.id}`}>
							Run ID: {run.id} - Status: {run.status}
						</Link>
					</li>
				))}
			</ul>
		</div>
	)
}

export default BotDetails
