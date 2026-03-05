import http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

type ProgressPayload = {
  type: 'completion' | 'reset'
  taskId: number
  goalId: number
  moduleId: number | null
  goalModuleId: number | null
  period: number | null
  totalForTask?: number
  timestamp: string
}

let io: Server | null = null

const getTokenFromHandshake = (socket: any): string | undefined => {
  const fromAuth = socket.handshake?.auth?.token as string | undefined
  const fromQuery = socket.handshake?.query?.token as string | undefined
  const fromHeader = (socket.handshake?.headers?.authorization as string | undefined)
    ?.replace(/^Bearer\s+/i, '')

  return fromAuth || fromQuery || fromHeader
}

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    const token = getTokenFromHandshake(socket)
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        socket.data.sessionInfo = decoded
      } catch (error) {
        socket.disconnect(true)
        return
      }
    }

    socket.on('joinModule', (moduleId: number) => {
      if (!moduleId) return
      socket.join(`module:${moduleId}`)
    })

    socket.on('leaveModule', (moduleId: number) => {
      if (!moduleId) return
      socket.leave(`module:${moduleId}`)
    })

    socket.on('joinTask', (taskId: number) => {
      if (!taskId) return
      socket.join(`task:${taskId}`)
    })

    socket.on('leaveTask', (taskId: number) => {
      if (!taskId) return
      socket.leave(`task:${taskId}`)
    })
  })

  return io
}

export const getIo = () => io

export const emitProgressUpdate = (payload: ProgressPayload) => {
  if (!io) return

  const rooms = [
    'progress:all',
    payload.moduleId ? `module:${payload.moduleId}` : null,
    payload.goalModuleId ? `module:${payload.goalModuleId}` : null,
    payload.taskId ? `task:${payload.taskId}` : null,
  ].filter(Boolean) as string[]

  rooms.forEach((room) => {
    io!.to(room).emit('progress:update', payload)
  })
}
