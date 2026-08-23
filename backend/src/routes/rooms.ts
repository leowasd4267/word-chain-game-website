import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../utils/auth'

const prisma = new PrismaClient()
const router = express.Router()

router.get('/rooms', async (req, res) => {
  const rooms = await prisma.room.findMany({ include: { players: { include: { user: true } } } })
  res.json(rooms.map(r=>({ id: r.id, name: r.name, players: r.players.map(p=>p.user.username) })))
})

router.post('/rooms', async (req: any, res) => {
  const { name } = req.body
  const user = (req as any).user
  const room = await prisma.room.create({ data: { name, ownerId: user.id } })
  res.json(room)
})

// join room - creates RoomPlayer record
router.post('/rooms/:id/join', async (req: any, res) => {
  const roomId = req.params.id
  const user = (req as any).user
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { players: true } })
  if(!room) return res.status(404).json({ message: 'Room not found' })
  if(room.players.length >= 8) return res.status(400).json({ message: 'Room full' })
  const existing = await prisma.roomPlayer.findFirst({ where: { roomId, userId: user.id } })
  if(existing) return res.json({ ok: true })
  await prisma.roomPlayer.create({ data: { roomId, userId: user.id } })
  res.json({ ok: true })
})

// leave room
router.post('/rooms/:id/leave', async (req: any, res) => {
  const roomId = req.params.id
  const user = (req as any).user
  await prisma.roomPlayer.deleteMany({ where: { roomId, userId: user.id } })
  res.json({ ok: true })
})

export default router
