import React, { useState } from 'react'
import Login from './pages/Login'
import Lobby from './pages/Lobby'
import Room from './pages/Room'
import Contact from './pages/Contact'
import AdminInquiries from './pages/AdminInquiries'

export default function App(){
  const [token, setToken] = useState<string | null>(null)
  const [route, setRoute] = useState<string>(window.location.hash.replace('#','') || '/')
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)

  window.addEventListener('hashchange', ()=> setRoute(window.location.hash.replace('#','') || '/'))

  if(!token) return <Login onLogin={(t)=>setToken(t)} />

  if(route.startsWith('/rooms/')){
    const id = route.replace('/rooms/','')
    return <Room token={token} roomId={id} />
  }

  if(route === '/contact') return <Contact />
  if(route === '/admin') return <AdminInquiries token={token} />

  return <Lobby token={token} />
}
