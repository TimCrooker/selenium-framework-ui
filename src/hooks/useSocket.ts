// hooks/useSocket.ts
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = (url: string, options = {}) => {
	const { current: socket } = useRef<Socket>(io(url, options))

	useEffect(() => {
		// Clean up on unmount
		return () => {
			socket.disconnect()
		}
	}, [socket])

	return socket
}
