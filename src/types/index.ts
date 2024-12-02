export interface Bot {
	_id: string
	name: string
	script: string
	schedule?: string
}

export interface Run {
	_id: string
	bot_id: string
	status: string
	start_time?: string
	end_time?: string
	logs?: string
}

export interface RunLog {
	_id: string
	run_id: string
	level: LogLevel
	message: string
	timestamp: string
	payload?: Record<string, any>
}

export interface RunEvent {
	_id: string
	run_id: string
	event_type: string
	message: string
	timestamp: string
	payload?: Record<string, any>
	screenshot?: string
}

export interface Agent {
	agent_id: string
	status: string
	last_heartbeat?: string
	resources?: Record<string, any>
	public_url?: string
}

export enum RunStatus {
	QUEUED = "queued",
	SCHEDULED = "scheduled",
	STARTING = "starting",
	RUNNING = "running",
	COMPLETED = "completed",
	ERROR = "error",
	CANCELLED = "cancelled"
}

export enum LogLevel {
	DEBUG = "DEBUG",
	INFO = "INFO",
	WARNING = "WARNING",
	ERROR = "ERROR",
	CRITICAL = "CRITICAL"
}
