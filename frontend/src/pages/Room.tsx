import React, { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export default function Room({ token, roomId }: { token: string, roomId: string }){
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, setGameState] = useState<any>(null)
  const [wordInput, setWordInput] = useState('')

  useEffect(()=>{
    const s = io((import.meta.env.VITE_API_URL || 'http://localhost:4000'), { auth: { token } })
    setSocket(s)
    s.on('connect', ()=>{
      s.emit('join_room', { roomId })
    })
    s.on('lobby_chat', (m: any)=> setMessages(prev=>[...prev, m]))
    s.on('player_joined', (p:any)=> setMessages(prev=>[...prev, { system: true, text: `${p.user.username} joined` }]))
    s.on('player_left', (p:any)=> setMessages(prev=>[...prev, { system: true, text: `${p.user.username} left` }]))
    s.on('game_started', ({ gameId })=>{ setGameStarted(true); setMessages(prev=>[...prev, { system:true, text: 'Game started' }]); })
    s.on('game_state', (st:any)=> setGameState(st))
    s.on('word_accepted', ({ playerId, word })=> setMessages(prev=>[...prev, { system:true, text:`${word} accepted by ${playerId}` }]))
    s.on('word_rejected', ({ reason })=> setMessages(prev=>[...prev, { system:true, text:`Rejected: ${reason}` }]))
    return ()=>{ s.disconnect() }
  }, [roomId, token])

  function sendChat(e:any){
    e.preventDefault()
    if(!socket) return
    socket.emit('lobby_chat', { roomId, message: input })
    setInput('')
  }

  function startGame(){
    socket?.emit('start_game', { roomId })
  }

  function submitWord(e:any){
    e.preventDefault()
    if(!socket || !gameState) return
    const gameId = (gameState.gameId) || null
    // server sends gameId in game_started; but for simplicity, we rely on current games via emit
    socket.emit('submit_word', { gameId: gameState.gameId, word: wordInput })
    setWordInput('')
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Room: {roomId}</h3>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h4>Chat</h4>
          <div style={{ height: 300, overflow: 'auto', border: '1px solid #ccc', padding: 10 }}>
            {messages.map((m, i)=>(<div key={i}>{m.system ? (m.text) : (<><b>{m.user.username}:</b> {m.message}</>)}</div>))}
          </div>
          <form onSubmit={sendChat}>
            <input value={input} onChange={e=>setInput(e.target.value)} />
            <button type="submit">Send</button>
          </form>
        </div>
        <div style={{ width: 400 }}>
          <h4>Game</h4>
          {!gameStarted && <button onClick={startGame}>Start Game</button>}
          {gameState && (
            <div>
              <div>Current Player: {gameState.currentPlayerId}</div>
              <div>Last Word: {gameState.lastWord}</div>
              <div>Time Left: {gameState.timeLeft}</div>
            </div>
          )}
          {gameStarted && (
            <form onSubmit={submitWord}>
              <input value={wordInput} onChange={e=>setWordInput(e.target.value)} placeholder="submit word" />
              <button type="submit">Submit</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
