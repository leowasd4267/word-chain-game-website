import express from 'express'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { verifyTokenMiddleware } from '../utils/auth'

dotenv.config()
const prisma = new PrismaClient()
const router = express.Router()

// Public: submit inquiry
router.post('/inquiries', async (req, res) => {
  const { name, email, message } = req.body
  if(!name || !email || !message) return res.status(400).json({ message: 'name, email, message required' })
  const inquiry = await prisma.inquiry.create({ data: { name, email, message } })
  // TODO: send email if SMTP configured
  res.json({ ok: true, inquiry })
})

// Admin: list inquiries
router.get('/inquiries', verifyTokenMiddleware, async (req: any, res) => {
  const user = req.user
  if(!user.isAdmin) return res.status(403).json({ message: 'Forbidden' })
  const list = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(list)
})

export default router
