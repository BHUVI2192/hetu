'use client'
import { useState } from 'react'
export default function Login() {
  const [email, setEmail] = useState('demo@404ai.dev')
  const [password, setPassword] = useState('demo1234')
  return <div className='min-h-screen flex items-center justify-center'><form className='w-80 space-y-4'><h1 className='text-2xl font-bold font-mono'>404 AI</h1><input value={email} onChange={e=>setEmail(e.target.value)} className='w-full p-2 bg-[#111] border border-[#222] rounded text-sm' /><input type='password' value={password} onChange={e=>setPassword(e.target.value)} className='w-full p-2 bg-[#111] border border-[#222] rounded text-sm' /><button className='w-full p-2 bg-white text-black rounded font-medium text-sm'>Sign In</button></form></div>
}