import { useEffect, useState } from 'react'
import { useSocket } from '../hooks/useSocket'

interface Bot {
	bot_id: string
	name: string
	status: string
}

const BotList = () => {
	const [bots, setBots] = useState<Bot[]>([])

	const socket = useSocket('http://localhost:8000')

	useEffect(() => {
		// Fetch initial bots
		fetch('/api/bots')
			.then((res) => res.json())
			.then((data) => setBots(data))

		// Listen for bot status updates
		socket.on('bot_status', (message: { bot_id: string; status: string }) => {
			setBots((prevBots) =>
				prevBots.map((bot) =>
					bot.bot_id === message.bot_id
						? { ...bot, status: message.status }
						: bot
				)
			)
		})

		return () => {
			socket.off('bot_status')
		}
	}, [socket])

	return (
		<ul>
			{bots.map((bot) => (
				<li key={bot.bot_id}>
					{bot.name}: {bot.status}
				</li>
			))}
		</ul>
	)
}

export default BotList
