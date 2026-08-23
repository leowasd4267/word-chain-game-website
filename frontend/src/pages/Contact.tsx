import React, { useState } from 'react'

export default function Contact(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  async function submit(e:any){
    e.preventDefault()
    const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message }) })
    if(res.ok){
      alert('Sent')
      setName(''); setEmail(''); setMessage('')
    }else alert('Failed')
  }
  return (
    <div style={{ padding: 20 }}>
      <h3>Contact / Inquiry</h3>
      <form onSubmit={submit}>
        <div><input placeholder="name" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><textarea placeholder="message" value={message} onChange={e=>setMessage(e.target.value)} /></div>
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
