export interface Bot {
	id: string
	name: string
	script: string
	schedule?: string
}

export interface Run {
	id: string
	bot_id: string
	status: string
	start_time?: string
	end_time?: string
	logs?: string
}

export interface RunLog {
	run_id: string
	timestamp: string
	message: string
	screenshot?: string
	payload?: Record<string, any>
}

export interface Agent {
	agent_id: string
	status: string
	last_heartbeat?: string
	resources?: Record<string, any>
	public_url?: string
}