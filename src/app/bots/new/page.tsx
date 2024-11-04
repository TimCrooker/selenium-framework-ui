'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/utils/apiClient'

const NewBot: React.FC = () => {
	const router = useRouter()
	const [name, setName] = useState('')
	const [script, setScript] = useState('')
	const [schedule, setSchedule] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			await apiClient.post('/bots', { name, script, schedule })
			router.push('/bots')
		} catch (error) {
			console.error('Error registering bot:', error)
		}
	}

	return (
		<div>
			<h1>Register New Bot</h1>
			<form onSubmit={handleSubmit}>
				<div>
					<label>Bot Name:</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
				</div>
				<div>
					<label>Script Path:</label>
					<input
						value={script}
						onChange={(e) => setScript(e.target.value)}
						required
					/>
				</div>
				<div>
					<label>Schedule (Cron Expression):</label>
					<input
						value={schedule}
						onChange={(e) => setSchedule(e.target.value)}
					/>
				</div>
				<button type="submit">Register Bot</button>
			</form>
		</div>
	)
}

export default NewBot
