import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()
const prisma = new PrismaClient()

async function main(){
  const adminName = process.env.ADMIN_USERNAME || 'leowasd4267'
  const adminNumber = process.env.ADMIN_NUMBER || '0000'
  const hash = await bcrypt.hash(adminNumber, 10)
  await prisma.user.upsert({
    where: { username: adminName },
    update: { numberHash: hash, isAdmin: true },
    create: { username: adminName, numberHash: hash, isAdmin: true }
  })
  console.log('Seed completed')
}

main().catch(e=>{
  console.error(e)
  process.exit(1)
}).finally(()=>process.exit())
