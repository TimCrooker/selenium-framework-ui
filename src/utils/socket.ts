import { io, Socket } from 'socket.io-client';

const socket: Socket = io(`${process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:8000'}/ui`, {
  transports: ['websocket'],
});

export default socket;
