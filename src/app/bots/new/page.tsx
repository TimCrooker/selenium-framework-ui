'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/utils/apiClient'
import { Container, Typography, TextField, Button, Paper } from '@mui/material';

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
		<Container>
			<Typography variant="h4" gutterBottom>Register New Bot</Typography>
			<Paper elevation={3} style={{ padding: '1em' }}>
				<form onSubmit={handleSubmit}>
					<TextField
						label="Bot Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						fullWidth
						margin="normal"
					/>
					<TextField
						label="Script Path"
						value={script}
						onChange={(e) => setScript(e.target.value)}
						required
						fullWidth
						margin="normal"
					/>
					<TextField
						label="Schedule (Cron Expression)"
						value={schedule}
						onChange={(e) => setSchedule(e.target.value)}
						fullWidth
						margin="normal"
					/>
					<Button type="submit" variant="contained" color="primary" style={{ marginTop: '1em' }}>
						Register Bot
					</Button>
				</form>
			</Paper>
		</Container>
	)
}

export default NewBot
