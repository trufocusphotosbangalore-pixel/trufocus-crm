import React, { useState } from 'react'
import { Sparkles, Navigation, Phone, Camera, CheckCircle2 } from 'lucide-react'

export default function CrewAiAssistantPage() {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your Trufocus Crew Assistant. Click any quick action button below or ask a question.' },
  ])
  const [input, setInput] = useState('')

  const handleAction = (query: string, response: string) => {
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: query },
      { sender: 'ai', text: response },
    ])
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text },
      { sender: 'ai', text: `Got it! Looking up information for "${text}"... Your next assignment is Royal Wedding Reception at Royal Palace Banquet.` },
    ])
  }

  return (
    <div className="space-y-6 text-gray-900 font-sans max-w-7xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Sparkles size={24} className="text-[#5B3FD9]" /> Action-Oriented Crew Assistant
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Fast action triggers and context-aware responses during shoots & editing.
        </p>
      </div>

      {/* Quick Action Trigger Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => handleAction('Where is today’s venue?', '📍 Today’s venue: Royal Palace Banquet Hall. Click below to open 1-click Google Navigation: https://maps.google.com')}
          className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#5B3FD9] text-left text-xs font-bold text-gray-900 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <Navigation size={15} className="text-emerald-600" />
          <span>1-Click Navigation</span>
        </button>

        <button
          onClick={() => handleAction('Show today’s checklist', '📋 Today’s Checklist:\n1. Check In via app\n2. Verify dual RAW recording\n3. Drone aerials at 11:00 AM\n4. Submit memory cards post-shoot')}
          className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#5B3FD9] text-left text-xs font-bold text-gray-900 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <CheckCircle2 size={15} className="text-amber-600" />
          <span>Today’s Checklist</span>
        </button>

        <button
          onClick={() => handleAction('Who is today’s coordinator?', '📞 Lead Event Coordinator: Studio Ops (+91 98765 00000)')}
          className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#5B3FD9] text-left text-xs font-bold text-gray-900 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <Phone size={15} className="text-purple-600" />
          <span>Call Coordinator</span>
        </button>

        <button
          onClick={() => handleAction('Gear requirements', '📷 Gear Specs: Dual SD Cards (128GB+), 24-70mm f/2.8 lens, charged batteries.')}
          className="p-3 rounded-xl bg-white border border-gray-200 hover:border-[#5B3FD9] text-left text-xs font-bold text-gray-900 transition-all cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <Camera size={15} className="text-blue-600" />
          <span>Gear Requirements</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 min-h-[360px] flex flex-col justify-between">
        <div className="space-y-3 overflow-y-auto max-h-[300px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl text-xs max-w-[85%] font-medium whitespace-pre-line ${
                m.sender === 'user'
                  ? 'bg-[#5B3FD9] text-white ml-auto font-bold'
                  : 'bg-slate-100 border border-gray-200 text-gray-800'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-gray-100">
          <input
            type="text"
            placeholder="Type your message or query..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-10 px-4 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-[#5B3FD9]"
          />
          <button
            type="submit"
            className="px-5 h-10 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white text-xs font-extrabold cursor-pointer shadow-xs"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
