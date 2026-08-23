import React, { useEffect, useState } from 'react'

export default function AdminInquiries({ token }: { token: string }){
  const [list, setList] = useState<any[]>([])
  useEffect(()=>{ fetchList() }, [])
  async function fetchList(){
    const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api/inquiries', { headers: { Authorization: 'Bearer ' + token } })
    const data = await res.json()
    setList(data)
  }
  return (
    <div style={{ padding: 20 }}>
      <h3>Admin - Inquiries</h3>
      <ul>
        {list.map(i=> <li key={i.id}><b>{i.name}</b> ({i.email}) - {new Date(i.createdAt).toLocaleString()}<br/>{i.message}</li>)}
      </ul>
    </div>
  )
}
