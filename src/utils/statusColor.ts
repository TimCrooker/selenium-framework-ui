import { LogLevel, RunStatus } from "@/types"

export const getStatusColor = (status: RunStatus) => {
	switch (status) {
		case RunStatus.COMPLETED:
			return 'green'
		case RunStatus.ERROR:
			return 'red'
		case RunStatus.RUNNING:
			return 'blue'
		case RunStatus.STARTING:
			return 'orange'
		case RunStatus.QUEUED:
			return 'purple'
		case RunStatus.SCHEDULED:
			return "light-green"
		default:
			return 'grey'
	}
}

export const getLogLevelColor = (level: LogLevel) => {
	switch (level) {
		case LogLevel.DEBUG:
			return 'grey'
		case LogLevel.INFO:
			return 'green'
		case LogLevel.WARNING:
			return 'orange'
		case LogLevel.ERROR:
			return 'red'
		case LogLevel.CRITICAL:
			return 'purple'
		default:
			return 'grey'
	}
}