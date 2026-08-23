import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRouter from './routes/auth'
import roomsRouter from './routes/rooms'
import inquiriesRouter from './routes/inquiries'
import { verifyTokenMiddleware, getUserFromToken } from './utils/auth'
import { WordChecker } from './game/wordChecker'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()

app.use('/api', authRouter)
app.use('/api', verifyTokenMiddleware, roomsRouter)
app.use('/api', inquiriesRouter) // inquiries: POST public, GET protected inside router

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

// Simple in-memory room game state (for realtime operations). Persisted to DB on game end.
const games = new Map<string, any>()
const wordChecker = new WordChecker()

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token
  if(!token) return next(new Error('Unauthorized'))
  try{
    const user = await getUserFromToken(token)
    (socket as any).user = user
    next()
  }catch(err){
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  const user = (socket as any).user
  console.log('socket connected', user.username)

  socket.on('join_room', async ({ roomId }) => {
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { players: { include: { user: true } } } })
    if(!room) return socket.emit('error', { message: 'Room not found' })
    const players = room.players.map(p=>p.user)
    if(players.length >= 8) return socket.emit('room_full')
    socket.join(roomId)
    io.to(roomId).emit('player_joined', { user: { id: user.id, username: user.username } })
  })

  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId)
    io.to(roomId).emit('player_left', { user: { id: user.id, username: user.username } })
  })

  socket.on('lobby_chat', ({ roomId, message }) => {
    io.to(roomId).emit('lobby_chat', { user: { id: user.id, username: user.username }, message, ts: Date.now() })
  })

  socket.on('start_game', async ({ roomId }) => {
    // basic start: create game record, init state
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { players: { include: { user: true } } } })
    if(!room) return socket.emit('error', { message: 'Room not found' })
    const players = room.players.map(p=>p.user)
    if(players.length < 2) return socket.emit('error', { message: 'Not enough players' })
    const game = await prisma.game.create({ data: { roomId, state: { players: players.map(u=>({ id: u.id, username: u.username })), turnIndex: 0, lastWord: null, scores: {} } } })
    games.set(game.id, { roomId, players, lastWord: null, usedWords: new Set(), turnIndex: 0, timer: null })
    io.to(roomId).emit('game_started', { gameId: game.id })
    startTurn(io, game.id)
  })

  socket.on('submit_word', async ({ gameId, word }) => {
    const gs = games.get(gameId)
    if(!gs) return socket.emit('error', { message: 'Game not found' })
    const isValid = await wordChecker.check(word, gs.lastWord, Array.from(gs.usedWords))
    if(!isValid.ok) return socket.emit('word_rejected', { reason: isValid.reason })
    // record move in memory and DB
    const turnIndex = gs.turnIndex
    gs.usedWords.add(word)
    gs.lastWord = word
    gs.turnIndex = (gs.turnIndex + 1) % gs.players.length
    // persist move
    await prisma.move.create({ data: { gameId, playerId: user.id, word, turnIndex } })
    io.to(gs.roomId).emit('word_accepted', { playerId: user.id, word })
    // proceed to next turn
    clearTimeout(gs.timer)
    startTurn(io, gameId)
  })

  socket.on('disconnect', () => {
    console.log('socket disconnected')
  })
})

function startTurn(io: any, gameId: string){
  const gs = games.get(gameId)
  if(!gs) return
  const currentPlayer = gs.players[gs.turnIndex]
  io.to(gs.roomId).emit('game_state', { currentPlayerId: currentPlayer.id, lastWord: gs.lastWord, turnIndex: gs.turnIndex, timeLeft: 30 })
  gs.timer = setTimeout(async ()=>{
    // timeout handling: skip player
    const skipped = gs.players[gs.turnIndex]
    gs.turnIndex = (gs.turnIndex + 1) % gs.players.length
    io.to(gs.roomId).emit('player_timed_out', { playerId: skipped.id })
    startTurn(io, gameId)
  }, 30000)
}

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log('Server listening on', PORT))
