import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Send, Square, Plus, Trash2, Copy, Check, RefreshCw,
  MessageSquare, Database, Cpu, Zap, Paperclip, ChevronLeft, ChevronRight, Download, CheckCircle2,
  FolderKanban, Briefcase, ChevronDown, Image as ImageIcon, Wand2, Share2, Mail, Layers,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { streamAIChatResponse, fetchActiveAIModel, formatModelDisplayName, type ChatMessage } from '@/services/aiService'
import { getAIUsageSummary } from '@/services/aiUsageStore'
import { analyzePromptPermission } from '@/services/aiPermissionService'
import { MarkdownRenderer } from '@/components/ai/MarkdownRenderer'
import { getLocalWorkOrders } from '@/services/supabase/workOrders'
import type { WorkOrder } from '@/types/workOrders'
import { generateAIImage, fetchAvailableOpenAIModels, getActiveImageModel } from '@/services/aiImageService'
import { getGeneratedImagesHistory, deleteGeneratedImageRecord, type GeneratedImageRecord } from '@/services/aiImageStore'
import { uploadCrmDocumentFile } from '@/services/documentManagementStore'
import { loadBusinessProfile } from '@/services/businessProfileStore'
import { toast } from 'react-hot-toast'
import { OpenAiErrorDisplay, type StructuredOpenAiError } from '@/components/ai/OpenAiErrorDisplay'

interface Conversation {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

const STORAGE_CHATS_KEY = 'trufocus_ai_chats_v1'

const CHAT_CATEGORIES = [
  { id: 'all', label: 'All Actions', icon: '✨' },
  { id: 'work_orders', label: 'Work Orders', icon: '📁' },
  { id: 'finance', label: 'Finance', icon: '💳' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'post_production', label: 'Post Production', icon: '🎬' },
  { id: 'enquiries', label: 'Enquiries', icon: '📥' },
  { id: 'client_portal', label: 'Client Portal', icon: '🌐' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'bi', label: 'Business Intelligence', icon: '📈' },
  { id: 'ai_tools', label: 'AI Tools', icon: '🛠️' },
]

const IMAGE_CATEGORIES = [
  { id: 'marketing_poster', label: 'Marketing Posters', icon: '🎨', promptTemplate: 'Luxury wedding photography marketing poster for Trufocus Photography featuring gold foil typography, deep midnight background, and high-fashion couple portrait.' },
  { id: 'wedding_ad', label: 'Wedding Advertisements', icon: '💍', promptTemplate: 'Cinematic wedding photography advertisement flyer with gold typography, black luxury aesthetics, and tagline "Your Event, Online and On Point."' },
  { id: 'album_cover', label: 'Album Covers', icon: '📖', promptTemplate: 'Premium luxury wedding photo album leather cover mock-up with embossed gold lettering and ornate border detailing.' },
  { id: 'quotation_cover', label: 'Quotation Cover Pages', icon: '📜', promptTemplate: 'Elegant pricing quotation cover page design for high-budget destination weddings with sleek typography and subtle gold accents.' },
  { id: 'social_post', label: 'Social Media Posts', icon: '📸', promptTemplate: 'Modern Instagram post graphic showcasing candid luxury wedding storytelling for Trufocus Photography.' },
  { id: 'reels_thumbnail', label: 'Reels Thumbnails', icon: '🎬', promptTemplate: 'Vibrant wedding Instagram Reel cover thumbnail with dramatic lighting, bold title overlay, and 4K cinematic preview.' },
  { id: 'youtube_thumbnail', label: 'YouTube Thumbnails', icon: '📺', promptTemplate: 'Cinematic 4K wedding film teaser YouTube thumbnail with high contrast gold title overlay and emotional couple moment.' },
  { id: 'invitation', label: 'Invitation Concepts', icon: '💌', promptTemplate: 'Royal luxury wedding invitation card design with intricate golden damask motifs, ivory background, and elegant script fonts.' },
  { id: 'business_card', label: 'Business Cards', icon: '💳', promptTemplate: 'Minimalist luxury studio business card mock-up for Trufocus Photography with matte black paper and metallic gold typography.' },
  { id: 'flyer', label: 'Flyers', icon: '📄', promptTemplate: 'A4 luxury marketing flyer showcasing wedding, pre-wedding, and maternity photography packages for Trufocus Photography.' },
  { id: 'banner', label: 'Banner Designs', icon: '🚩', promptTemplate: 'Wide website banner header design featuring cinematic wedding film stills, gold accents, and brand tagline.' },
]

const CHAT_PROMPTS = [
  // Work Orders
  { id: 'wo-1', category: 'work_orders', title: "Today's Shoots", icon: '📅', prompt: "Show me all shoot events and team assignments scheduled for today." },
  { id: 'wo-2', category: 'work_orders', title: 'Show Active Work Orders', icon: '📋', prompt: "List all active work orders with their current status, client name, and pending balance." },
  { id: 'wo-3', category: 'work_orders', title: 'Work Orders Needing Action', icon: '⚡', prompt: "Which work orders require immediate coordinator action, venue details, or team assignment?" },
  { id: 'wo-4', category: 'work_orders', title: 'Shoot Schedule Overview', icon: '⏱️', prompt: "Summarize the upcoming shoot schedule for the next 7 days across all active projects." },

  // Finance
  { id: 'fin-1', category: 'finance', title: 'Show Pending Payments', icon: '💳', prompt: "List all work orders with pending balance payments and calculate total accounts receivable." },
  { id: 'fin-2', category: 'finance', title: 'Generate Invoice', icon: '🧾', prompt: "Draft a professional tax invoice breakdown for a completed wedding photography assignment including GST." },
  { id: 'fin-3', category: 'finance', title: 'Show Revenue This Month', icon: '💰', prompt: "Summarize total revenue collected this month and compare it with pending client balances." },

  // Marketing & BI
  { id: 'mkt-1', category: 'marketing', title: 'Generate WhatsApp Follow-up', icon: '💬', prompt: "Write 3 high-converting, polite WhatsApp follow-up message templates for prospective wedding clients who asked for pricing." },
  { id: 'mkt-2', category: 'marketing', title: 'Create Instagram Caption', icon: '📸', prompt: "Write 5 engaging Instagram reel captions with trending hashtags for a wedding highlight reel showing romantic couple portraits." },
  { id: 'bi-1', category: 'bi', title: 'Business Growth Ideas', icon: '📈', prompt: "What are 5 strategic business improvements Trufocus Photography can implement to increase booking conversion rate by 30%?" },
]

export default function TrufocusAI() {
  // Mode Switcher: 'chat' | 'image'
  const [activeMode, setActiveMode] = useState<'chat' | 'image'>('chat')

  // Chat Assistant State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [, setUsageRefreshKey] = useState(0)
  const [useContext, setUseContext] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [selectedChatCategory, setSelectedChatCategory] = useState<string>('all')

  // Work Order Context Filter State
  const [selectedWoId, setSelectedWoId] = useState<string>('all')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])

  // AI Image Studio State
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>('marketing_poster')
  const [imagePromptInput, setImagePromptInput] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<GeneratedImageRecord | null>(null)
  const [generatedImagesHistory, setGeneratedImagesHistory] = useState<GeneratedImageRecord[]>([])
  const [debugMode, setDebugMode] = useState(false)
  const [currentStructuredError, setCurrentStructuredError] = useState<StructuredOpenAiError | null>(null)
  const [modelWarning, setModelWarning] = useState<{ unavailableModel: string; reason: string } | null>(null)
  const [currentDebugLog, setCurrentDebugLog] = useState<{
    originalPrompt: string
    finalPrompt: string
    requestPayload: any
    rawResponse: any
    generationTimeMs: number
    modelUsed: string
    error?: string
  } | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  const handleChatFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    toast.loading('Uploading file attachment to AI context...', { id: 'ai_file_upload' })

    try {
      for (let i = 0; i < files.length; i++) {
        const doc = await uploadCrmDocumentFile({
          file: files[i],
          category: 'Miscellaneous',
          module: 'work_orders',
          relatedId: selectedWoId !== 'all' ? selectedWoId : 'general_ai',
          uploadedBy: 'User (Trufocus AI)',
          sharedWithClient: true,
        })

        const fileNote = `\n\n📎 [Attached File: "${doc.file_name}" (${(doc.file_size / 1024).toFixed(0)} KB, Category: ${doc.category})]\nURL: ${doc.file_url}`

        if (activeMode === 'chat') {
          setInputMessage((prev) => (prev ? `${prev}${fileNote}` : `Analyze attached document: "${doc.file_name}"${fileNote}`))
        } else {
          setImagePromptInput((prev) => (prev ? `${prev}${fileNote}` : `Generate design inspired by attached reference: "${doc.file_name}"`))
        }
      }

      toast.success('🎉 Attachment uploaded & linked to AI prompt!', { id: 'ai_file_upload' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to attach file.', { id: 'ai_file_upload' })
    } finally {
      if (chatFileInputRef.current) chatFileInputRef.current.value = ''
    }
  }

  const [activeModelRaw, setActiveModelRaw] = useState<string>('gpt-4o-mini')

  // Load mount data & Requirement 4: Startup Automatic Verification
  useEffect(() => {
    fetchActiveAIModel().then((m) => {
      if (m) setActiveModelRaw(m)
    })

    try {
      const raw = localStorage.getItem(STORAGE_CHATS_KEY)
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw)
        setConversations(parsed)
        if (parsed.length > 0) {
          setActiveChatId(parsed[0].id)
        }
      }
    } catch (e) {
      console.error('Error loading conversations:', e)
    }

    const wos = getLocalWorkOrders().filter((w) => !w.deleted_at && w.status !== 'deleted')
    setWorkOrders(wos)

    // Load Image History
    setGeneratedImagesHistory(getGeneratedImagesHistory())

    // Requirement 4: Startup Model Verification
    fetchAvailableOpenAIModels()
      .then((res) => {
        if (!res.gptImage1Available) {
          setModelWarning({
            unavailableModel: 'gpt-image-1',
            reason: res.reason,
          })
        }
      })
      .catch(() => {
        // ignore network glitches
      })
  }, [])

  // Auto-populate default image prompt template when category changes
  useEffect(() => {
    const preset = IMAGE_CATEGORIES.find((c) => c.id === selectedImageCategory)
    if (preset) {
      let prompt = preset.promptTemplate
      const selectedWo = workOrders.find((w) => w.id === selectedWoId)
      const biz = loadBusinessProfile()

      if (selectedWo) {
        prompt = `${preset.label} for Client: "${selectedWo.customer_name}" (${selectedWo.event_type}). Event Date: ${selectedWo.booking_date || 'Upcoming'}. Brand: ${biz.business_name || 'Trufocus Photography'}. Colors: Black #111111, Gold #D4AF37, White #FFFFFF.`
      }
      setImagePromptInput(prompt)
    }
  }, [selectedImageCategory, selectedWoId, workOrders])

  // Save conversations
  const saveConversations = (updated: Conversation[]) => {
    setConversations(updated)
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Error saving conversations:', e)
    }
  }

  const currentChat = conversations.find((c) => c.id === activeChatId) || null
  const currentMessages = currentChat ? currentChat.messages : []

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeMode === 'chat') scrollToBottom()
  }, [currentMessages.length, isGenerating, activeMode])

  // New Chat
  const handleNewChat = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const newChat: Conversation = {
      id: 'chat-' + Date.now(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    }
    saveConversations([newChat, ...conversations])
    setActiveChatId(newChat.id)
    setInputMessage('')
  }

  // Delete Chat
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = conversations.filter((c) => c.id !== chatId)
    saveConversations(updated)
    if (activeChatId === chatId) {
      setActiveChatId(updated[0]?.id || null)
    }
    toast.success('Conversation deleted.')
  }

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
      toast('Generation stopped.', { icon: '⏹️' })
    }
  }

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isGenerating) return

    let targetChatId = activeChatId
    let updatedConversations = [...conversations]

    if (!targetChatId || !updatedConversations.some((c) => c.id === targetChatId)) {
      const newChat: Conversation = {
        id: 'chat-' + Date.now(),
        title: text.slice(0, 30) + '...',
        createdAt: new Date().toISOString(),
        messages: [],
      }
      targetChatId = newChat.id
      updatedConversations = [newChat, ...updatedConversations]
    }

    const userMsg: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const assistantMsgPlaceholder: ChatMessage = {
      id: 'msg-asst-' + Date.now(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }

    const targetChatIndex = updatedConversations.findIndex((c) => c.id === targetChatId)
    const targetChat = updatedConversations[targetChatIndex]

    if (targetChat.messages.length === 0) {
      targetChat.title = text.slice(0, 35) + (text.length > 35 ? '...' : '')
    }

    targetChat.messages = [...targetChat.messages, userMsg, assistantMsgPlaceholder]
    updatedConversations[targetChatIndex] = targetChat
    saveConversations(updatedConversations)
    setActiveChatId(targetChatId)
    setInputMessage('')

    setIsGenerating(true)
    abortControllerRef.current = new AbortController()

    await streamAIChatResponse({
      messages: targetChat.messages.filter((m) => !m.isStreaming),
      useCRMContext: useContext,
      signal: abortControllerRef.current.signal,
      onChunk: (chunkText) => {
        setConversations((prevChats) => {
          return prevChats.map((c) => {
            if (c.id !== targetChatId) return c
            const updatedMsgs = c.messages.map((m) => {
              if (m.id === assistantMsgPlaceholder.id) {
                return { ...m, content: m.content + chunkText }
              }
              return m
            })
            return { ...c, messages: updatedMsgs }
          })
        })
      },
      onComplete: (fullText) => {
        setIsGenerating(false)
        setUsageRefreshKey((k) => k + 1)
        fetchActiveAIModel().then((m) => {
          if (m) setActiveModelRaw(m)
        })
        setConversations((prevChats) => {
          const final = prevChats.map((c) => {
            if (c.id !== targetChatId) return c
            const updatedMsgs = c.messages.map((m) => {
              if (m.id === assistantMsgPlaceholder.id) {
                return { ...m, content: fullText, isStreaming: false }
              }
              return m
            })
            return { ...c, messages: updatedMsgs }
          })
          try {
            localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(final))
          } catch (e) {
            console.error('Error saving final conversation state:', e)
          }
          return final
        })
      },
      onError: (errMsg) => {
        setIsGenerating(false)
        toast.error(`AI Error: ${errMsg}`)
        setConversations((prevChats) => {
          return prevChats.map((c) => {
            if (c.id !== targetChatId) return c
            const updatedMsgs = c.messages.map((m) => {
              if (m.id === assistantMsgPlaceholder.id) {
                return {
                  ...m,
                  content: `⚠️ **Error generating response:** ${errMsg}\n\nPlease check backend server or API key configuration.`,
                  isStreaming: false,
                }
              }
              return m
            })
            return { ...c, messages: updatedMsgs }
          })
        })
      },
    })
  }

  // Handle AI Image Generation
  const handleGenerateImage = async () => {
    const originalPrompt = imagePromptInput.trim()
    if (!originalPrompt || isGeneratingImage) return

    setIsGeneratingImage(true)
    setCurrentDebugLog(null)
    setCurrentStructuredError(null)
    const selectedWo = workOrders.find((w) => w.id === selectedWoId)
    const biz = loadBusinessProfile()
    const activeModel = getActiveImageModel()

    // Requirement 7: If CRM Context enabled, append context AFTER user prompt (do NOT replace it)
    let finalPrompt = originalPrompt
    if (useContext || selectedWoId !== 'all') {
      const contextBlocks: string[] = []
      contextBlocks.push(`Brand:\n${biz.business_name || 'Trufocus Photography'}`)
      contextBlocks.push(`Style:\nPremium luxury photography & artwork`)
      contextBlocks.push(`Colors:\nBlack (#111111), Gold (#D4AF37), White (#FFFFFF)`)
      if (selectedWo) {
        contextBlocks.push(`Client:\n${selectedWo.customer_name}`)
        contextBlocks.push(`Event:\n${selectedWo.event_type}`)
      }
      finalPrompt = `${originalPrompt}\n\n${contextBlocks.join('\n\n')}`
    }

    try {
      const { record, rawResponse, generationTimeMs } = await generateAIImage({
        originalPrompt,
        finalPrompt,
        workOrderId: selectedWoId !== 'all' ? selectedWoId : undefined,
        clientName: selectedWo?.customer_name,
        category: selectedImageCategory,
        model: activeModel,
        size: '1024x1024',
        quality: 'auto',
      })

      setCurrentGeneratedImage(record)
      setGeneratedImagesHistory(getGeneratedImagesHistory(selectedWoId))

      setCurrentDebugLog({
        originalPrompt,
        finalPrompt,
        requestPayload: {
          model: activeModel,
          prompt: finalPrompt,
          size: '1024x1024',
          quality: 'auto',
          n: 1,
        },
        rawResponse,
        generationTimeMs,
        modelUsed: record.model || activeModel,
      })

      toast.success('🎉 AI Artwork generated successfully!')
    } catch (err: any) {
      console.error('Image Generation Error:', err)
      setCurrentGeneratedImage(null)

      const structErr: StructuredOpenAiError = err.structuredError || {
        httpStatus: 400,
        type: 'invalid_request_error',
        code: 'image_generation_failed',
        message: err.message || 'Image generation failed.',
        requestedModel: activeModel,
      }

      setCurrentStructuredError(structErr)
      setCurrentDebugLog({
        originalPrompt,
        finalPrompt,
        requestPayload: err.requestPayload || {
          model: activeModel,
          prompt: finalPrompt,
          size: '1024x1024',
          quality: 'auto',
          n: 1,
        },
        rawResponse: err.rawResponse || null,
        generationTimeMs: err.generationTimeMs || 0,
        modelUsed: activeModel,
        error: structErr.message,
      })

      toast.error(`OpenAI Error (${structErr.httpStatus}): ${structErr.message}`)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Action Bar Handlers for Images
  const handleDownloadImage = (url: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `Trufocus_AI_Artwork_${Date.now()}.png`
    a.target = '_blank'
    a.click()
    toast.success('Download started!')
  }

  const handleShareWhatsApp = (img: GeneratedImageRecord) => {
    const text = encodeURIComponent(`Check out this AI-generated artwork for ${img.clientName || 'Trufocus Photography'}: ${img.url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleEmailClient = (img: GeneratedImageRecord) => {
    const subject = encodeURIComponent(`Trufocus Photography AI Artwork - ${img.clientName || 'Design Sample'}`)
    const body = encodeURIComponent(`Dear Client,\n\nPlease preview your custom design sample generated by Trufocus AI:\n\n${img.url}\n\nWarm regards,\nTrufocus Photography Team`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleDeleteImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteGeneratedImageRecord(id)
    setGeneratedImagesHistory(getGeneratedImagesHistory(selectedWoId))
    if (currentGeneratedImage?.id === id) {
      setCurrentGeneratedImage(null)
    }
    toast.success('Image deleted from history.')
  }

  const handleRegenerate = (msgIndex: number) => {
    if (!currentChat || isGenerating) return
    const prevMessages = currentChat.messages.slice(0, msgIndex)
    const lastUserMsg = [...prevMessages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      currentChat.messages = prevMessages
      saveConversations([...conversations])
      handleSendMessage(lastUserMsg.content)
    }
  }

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMsgId(msgId)
    toast.success('Copied response to clipboard!')
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const handleExportChat = () => {
    if (!currentChat || currentMessages.length === 0) return
    const formatted = currentMessages
      .map((m) => `### ${m.role === 'user' ? 'USER' : 'TRUFOCUS AI'} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n`)
      .join('\n---\n\n')

    const blob = new Blob([formatted], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Trufocus_AI_Chat_${currentChat.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`
    a.click()
    toast.success('Chat exported as Markdown file!')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (activeMode === 'chat') handleSendMessage()
      else handleGenerateImage()
    }
  }

  const usageStats = getAIUsageSummary()
  const selectedWo = workOrders.find((w) => w.id === selectedWoId)

  // Compute Chat Prompts (Rule 8: Hide unavailable AI action suggestions)
  let displayedChatPrompts = CHAT_PROMPTS.filter((p) => analyzePromptPermission(p.prompt).allowed)
  if (selectedChatCategory !== 'all') {
    displayedChatPrompts = displayedChatPrompts.filter((p) => p.category === selectedChatCategory)
  }

  if (selectedWo) {
    const woSpecificPrompts = [
      {
        id: `wo-act-1-${selectedWo.id}`,
        category: 'work_orders',
        title: `Quotation for ${selectedWo.customer_name}`,
        icon: '💍',
        prompt: `Generate a detailed luxury quotation breakdown for ${selectedWo.customer_name} (${selectedWo.work_order_number}) for event "${selectedWo.event_type}".`,
      },
      {
        id: `wo-act-2-${selectedWo.id}`,
        category: 'finance',
        title: `Generate Invoice for ${selectedWo.customer_name}`,
        icon: '🧾',
        prompt: `Draft a formal tax invoice breakdown for ${selectedWo.customer_name} (${selectedWo.work_order_number}). Package Net: ₹${selectedWo.payment?.net_amount || 0}, Pending Balance: ₹${selectedWo.payment?.balance_amount || 0}.`,
      },
      {
        id: `wo-act-3-${selectedWo.id}`,
        category: 'finance',
        title: `Record Payment for ${selectedWo.customer_name}`,
        icon: '💳',
        prompt: `Draft a payment receipt acknowledgement for ${selectedWo.customer_name} (${selectedWo.work_order_number}) towards pending balance of ₹${selectedWo.payment?.balance_amount || 0}.`,
      },
    ]
    displayedChatPrompts = [...woSpecificPrompts, ...displayedChatPrompts]
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#FAFAFC] font-sans overflow-hidden -m-4 sm:-m-6">
      {/* ─── LEFT SIDEBAR (CONVERSATION HISTORY & USAGE) ─── */}
      <div
        className={cn(
          'w-72 bg-[#1E1B3A] text-white flex flex-col border-r border-[#2A2650] transition-all duration-300 z-20 shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full md:relative md:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#2A2650] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#5B3FD9] text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-white tracking-wide">Trufocus AI</h2>
              <span className="text-[10px] font-mono text-purple-300 font-bold flex items-center gap-1">
                <Cpu size={11} className="text-emerald-400" /> {formatModelDisplayName(activeModelRaw)} & DALL-E 3
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2A2650]"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full h-11 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} /> New Conversation
          </button>
        </div>

        {/* Context-Aware CRM Badge */}
        <div className="px-3 py-2">
          <button
            onClick={() => setUseContext(!useContext)}
            className={cn(
              'w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer',
              useContext
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
                : 'bg-[#2A2650]/40 border-gray-700 text-gray-400'
            )}
          >
            <div className="flex items-center gap-2">
              <Database size={14} className={useContext ? 'text-amber-400' : 'text-gray-400'} />
              <span>CRM Data Context</span>
            </div>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase',
                useContext ? 'bg-amber-400 text-black' : 'bg-gray-700 text-gray-300'
              )}
            >
              {useContext ? 'Active' : 'Off'}
            </span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <span className="text-[10px] font-mono text-purple-300/70 font-bold uppercase tracking-wider block px-2 mb-1">
            Recent Chats ({conversations.length})
          </span>

          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 italic py-4">No past conversations.</p>
          ) : (
            conversations.map((chat) => {
              const isActive = chat.id === activeChatId
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id)
                    setActiveMode('chat')
                  }}
                  className={cn(
                    'group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer',
                    isActive && activeMode === 'chat'
                      ? 'bg-[#5B3FD9] text-white font-bold shadow-sm'
                      : 'text-purple-200 hover:bg-[#2A2650]/80 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <MessageSquare size={14} className="shrink-0 opacity-80" />
                    <span className="truncate">{chat.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-purple-300 hover:text-red-400 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Token Usage & Cost Summary Footer */}
        <div className="p-3.5 border-t border-[#2A2650] bg-[#17142E] text-[11px] space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-purple-300">
            <span className="flex items-center gap-1 font-bold">
              <Zap size={13} className="text-amber-400" /> Usage Summary
            </span>
            <span className="text-[10px] text-gray-400">{usageStats.requestCount} requests</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-gray-300 pt-1">
            <div className="bg-[#2A2650]/60 p-2 rounded-lg border border-purple-900/40">
              <span className="text-[9px] text-gray-400 block uppercase">Total Tokens</span>
              <span className="font-extrabold text-white">{usageStats.totalTokens.toLocaleString()}</span>
            </div>
            <div className="bg-[#2A2650]/60 p-2 rounded-lg border border-purple-900/40">
              <span className="text-[9px] text-gray-400 block uppercase">Est. Cost</span>
              <span className="font-extrabold text-emerald-400">${usageStats.totalCostUsd}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Chat Top Header & Mode Toggle Switcher */}
        <div className="h-16 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            )}

            <div>
              <h3 className="font-extrabold text-base text-[#111827] flex items-center gap-2">
                <span>{activeMode === 'chat' ? (currentChat ? currentChat.title : 'Trufocus AI Assistant') : 'AI Image Studio'}</span>
                <span className="text-[10px] font-mono font-bold text-[#5B3FD9] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {activeMode === 'chat' ? formatModelDisplayName(activeModelRaw) : 'DALL-E 3'}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {activeMode === 'chat' ? 'Text CRM Assistant & Structured Responses' : 'Generate Marketing Posters, Album Covers & Flyers'}
              </p>
            </div>
          </div>

          {/* ─── CHAT / IMAGES MODE SWITCHER TOGGLE ─── */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-2xl bg-gray-100 border border-gray-200">
              <button
                onClick={() => setActiveMode('chat')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer',
                  activeMode === 'chat'
                    ? 'bg-[#5B3FD9] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <MessageSquare size={14} /> Chat
              </button>

              <button
                onClick={() => setActiveMode('image')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer',
                  activeMode === 'image'
                    ? 'bg-[#5B3FD9] text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <ImageIcon size={14} /> Images
              </button>
            </div>

            {activeMode === 'chat' && currentMessages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={13} /> Export
              </button>
            )}
          </div>
        </div>

        {/* ─── WORK ORDER CONTEXT BAR (COMMON FOR BOTH MODES) ─── */}
        <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#111827]">
            <Briefcase size={15} className="text-[#5B3FD9]" />
            <span>Work Order Context Filter:</span>
          </div>

          <div className="relative min-w-[300px]">
            <select
              value={selectedWoId}
              onChange={(e) => setSelectedWoId(e.target.value)}
              className="w-full h-8 pl-3 pr-8 rounded-xl bg-white border border-gray-300 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#5B3FD9] appearance-none cursor-pointer"
            >
              <option value="all">✨ All CRM Data (Studio General Context)</option>
              {workOrders.map((w) => (
                <option key={w.id} value={w.id}>
                  📁 [{w.work_order_number}] {w.customer_name} ({w.event_type})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* ─── BODY DISPLAY (CHAT OR IMAGE STUDIO) ─── */}
        {activeMode === 'image' ? (
          /* 🎨 AI IMAGE STUDIO VIEW */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 min-h-0 bg-[#FAFAFC]">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              {/* Header Banner */}
              <div className="text-center space-y-2">
                <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#5B3FD9] to-amber-400 text-white flex items-center justify-center mx-auto shadow-lg">
                  <Wand2 size={30} />
                </div>
                <h1 className="text-2xl font-black text-[#111827]">
                  Trufocus AI Image Studio
                </h1>
                <p className="text-xs text-gray-500 max-w-lg mx-auto">
                  Generate luxury marketing posters, wedding ads, album covers, quotation covers, and social media post graphics powered by DALL-E 3.
                </p>
              </div>

              {/* Category Preset Chips */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
                  Select Image Template Type:
                </label>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {IMAGE_CATEGORIES.map((cat) => {
                    const isActive = selectedImageCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedImageCategory(cat.id)}
                        className={cn(
                          'px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 border',
                          isActive
                            ? 'bg-[#5B3FD9] border-[#5B3FD9] text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#5B3FD9]'
                        )}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ─── Startup Model Warning Banner (Requirement #4) ─── */}
              {modelWarning && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                      ⚠️ OpenAI Model Warning: '{modelWarning.unavailableModel}' Unavailable
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded text-amber-950">
                      API Model Check
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium">
                    {modelWarning.reason}
                  </p>
                  <p className="text-[11px] text-amber-900 font-semibold bg-white p-2.5 rounded-xl border border-amber-200">
                    💡 <strong>Recommendation:</strong> Switch your active model to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">dall-e-3</code> in Settings or check API key permissions. Placeholder images will never be generated.
                  </p>
                </div>
              )}

              {/* ─── Structured OpenAI API Error Display (Requirement #2 & #7) ─── */}
              {currentStructuredError && (
                <OpenAiErrorDisplay
                  error={currentStructuredError}
                  onCheckModels={() => {
                    const el = document.querySelector('[data-tab="ai_developer"]') as HTMLElement
                    if (el) el.click()
                  }}
                />
              )}

              {/* Image Prompt Builder & Generation Controls */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[#111827] flex items-center gap-2">
                      <Sparkles size={14} className="text-[#5B3FD9]" />
                      <span>Generation Prompt (Auto-injected with CRM Context)</span>
                    </label>
                    <button
                      onClick={() => {
                        const preset = IMAGE_CATEGORIES.find((c) => c.id === selectedImageCategory)
                        if (preset) setImagePromptInput(preset.promptTemplate)
                      }}
                      className="text-[10px] font-bold text-[#5B3FD9] hover:underline"
                    >
                      Reset Prompt
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={imagePromptInput}
                    onChange={(e) => setImagePromptInput(e.target.value)}
                    placeholder="Describe the artwork you want to generate..."
                    className="w-full p-3 bg-[#FAFAFC] rounded-xl border border-gray-200 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#5B3FD9] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Model: gpt-image-1 / DALL-E 3</span>
                    </div>

                    <button
                      onClick={() => setDebugMode(!debugMode)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer',
                        debugMode
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <span>🐞 Debug Mode</span>
                      <span className={cn('size-2 rounded-full', debugMode ? 'bg-amber-500 animate-pulse' : 'bg-gray-300')} />
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !imagePromptInput.trim()}
                    className="px-6 h-11 rounded-xl bg-gradient-to-r from-[#5B3FD9] to-purple-600 hover:from-[#4C34C3] hover:to-purple-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Sparkles size={16} className="animate-spin" />
                        <span>Generating AI Artwork...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        <span>Generate Artwork</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ─── Requirement 8: DEBUG MODE PANEL ─── */}
              {debugMode && currentDebugLog && (
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-700 font-mono text-xs space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                      🐞 AI Image Generation Debug Panel
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Generation Time: {currentDebugLog.generationTimeMs}ms • Model Used: {currentDebugLog.modelUsed}
                    </span>
                  </div>

                  {currentDebugLog.error && (
                    <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 font-sans text-xs">
                      <strong>OpenAI API Error:</strong> {currentDebugLog.error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Original Prompt:</span>
                      <p className="p-2 rounded bg-slate-800 text-slate-200 text-[11px] whitespace-pre-wrap">{currentDebugLog.originalPrompt}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Final Prompt Sent to OpenAI:</span>
                      <p className="p-2 rounded bg-slate-800 text-amber-200 text-[11px] whitespace-pre-wrap">{currentDebugLog.finalPrompt}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Request Body JSON:</span>
                      <pre className="p-2 rounded bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto max-h-36">
                        {JSON.stringify(currentDebugLog.requestPayload, null, 2)}
                      </pre>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">API Response JSON:</span>
                      <pre className="p-2 rounded bg-slate-950 text-blue-300 text-[10px] overflow-x-auto max-h-36">
                        {JSON.stringify(currentDebugLog.rawResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Generated Artwork Result Showcase */}
              {currentGeneratedImage && (
                <div className="p-6 rounded-2xl bg-white border border-purple-200 shadow-md space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-extrabold text-[#5B3FD9] flex items-center gap-1.5">
                      <Sparkles size={16} /> Generated AI Artwork Result
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(currentGeneratedImage.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-black aspect-square flex items-center justify-center">
                      <img
                        src={currentGeneratedImage.url}
                        alt="Generated AI Artwork"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-4">
                      {/* Requirement 6: Display prompt used underneath generated image */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-[#5B3FD9] font-extrabold uppercase block">
                          Generated using:
                        </span>
                        <p className="text-xs text-gray-900 font-medium bg-purple-50 p-3 rounded-xl border border-purple-100 leading-relaxed font-mono">
                          "{currentGeneratedImage.finalPrompt || currentGeneratedImage.prompt}"
                        </p>
                      </div>

                      {/* Action Toolbar */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Actions</span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-extrabold">
                          <button
                            onClick={() => handleDownloadImage(currentGeneratedImage.url)}
                            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-purple-50 hover:border-[#5B3FD9] text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download size={14} className="text-[#5B3FD9]" /> Download
                          </button>

                          <button
                            onClick={handleGenerateImage}
                            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-purple-50 hover:border-[#5B3FD9] text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw size={14} className="text-amber-500" /> Regenerate
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(currentGeneratedImage)}
                            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-500 text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Share2 size={14} className="text-emerald-600" /> Share WhatsApp
                          </button>

                          <button
                            onClick={() => handleEmailClient(currentGeneratedImage)}
                            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-500 text-gray-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Mail size={14} className="text-blue-600" /> Email Client
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Images History Gallery */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-extrabold text-[#111827] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers size={16} className="text-[#5B3FD9]" />
                    <span>CRM Artwork Gallery ({generatedImagesHistory.length})</span>
                  </span>
                </h3>

                {generatedImagesHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center bg-white rounded-2xl border border-gray-200">
                    No generated artwork saved yet. Choose a preset above to create your first design!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {generatedImagesHistory.map((img) => (
                      <div
                        key={img.id}
                        className="group relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all space-y-2"
                      >
                        <div className="aspect-square bg-black overflow-hidden relative">
                          <img src={img.url} alt="CRM Artwork" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <button
                            onClick={(e) => handleDeleteImage(img.id, e)}
                            className="absolute top-2 right-2 size-7 rounded-lg bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                            title="Delete Image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="p-3 space-y-1.5 text-xs">
                          <p className="font-extrabold text-[#111827] truncate">{img.clientName || img.category || 'AI Artwork'}</p>
                          <p className="text-[10px] text-purple-700 font-mono line-clamp-2 leading-tight bg-purple-50 p-1.5 rounded border border-purple-100">
                            <strong>Generated using:</strong> "{img.finalPrompt || img.originalPrompt || img.prompt}"
                          </p>

                          <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-[#5B3FD9]">
                            <button onClick={() => handleDownloadImage(img.url)} className="flex items-center gap-1 hover:underline">
                              <Download size={11} /> Download
                            </button>
                            <button onClick={() => handleShareWhatsApp(img)} className="flex items-center gap-1 hover:underline text-emerald-600">
                              <Share2 size={11} /> Share
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 💬 CHAT ASSISTANT VIEW */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 min-h-0 bg-[#FAFAFC]">
            {currentMessages.length === 0 ? (
              <div className="max-w-4xl mx-auto py-6 space-y-8 animate-in fade-in duration-300">
                {/* Hero Banner */}
                <div className="text-center space-y-3">
                  <div className="size-16 rounded-2xl bg-gradient-to-tr from-[#5B3FD9] to-purple-400 text-white flex items-center justify-center mx-auto shadow-xl">
                    <Sparkles size={36} />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#111827]">
                    Trufocus AI Studio Assistant
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                    Context-aware AI for Trufocus Photography. Select a quick CRM action below or choose a specific Work Order to generate instant quotations, invoices, WhatsApp drafts, and shoot shot lists.
                  </p>
                </div>

                {/* ─── QUICK CRM ACTIONS CATEGORY CHIPS ─── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#111827] flex items-center gap-2">
                      <FolderKanban size={16} className="text-[#5B3FD9]" />
                      <span>Quick CRM Actions</span>
                      <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {displayedChatPrompts.length} Prompts
                      </span>
                    </h3>
                  </div>

                  {/* Horizontal Category Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {CHAT_CATEGORIES.map((cat) => {
                      const isCatActive = selectedChatCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedChatCategory(cat.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 border',
                            isCatActive
                              ? 'bg-[#5B3FD9] border-[#5B3FD9] text-white shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-[#5B3FD9] hover:bg-purple-50/40'
                          )}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* ─── PREDEFINED PROMPT CARDS GRID ─── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {displayedChatPrompts.map((qp) => {
                      const catObj = CHAT_CATEGORIES.find((c) => c.id === qp.category)
                      return (
                        <button
                          key={qp.id}
                          onClick={() => handleSendMessage(qp.prompt)}
                          className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#5B3FD9] hover:-translate-y-0.5 hover:shadow-md text-left transition-all group cursor-pointer flex flex-col justify-between space-y-2.5 relative overflow-hidden"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{qp.icon}</span>
                              <span className="text-[9px] font-mono font-extrabold text-[#5B3FD9] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full uppercase">
                                {catObj?.label || qp.category}
                              </span>
                            </div>

                            <h4 className="text-xs font-extrabold text-[#111827] group-hover:text-[#5B3FD9] transition-colors leading-tight pt-1">
                              {qp.title}
                            </h4>

                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                              {qp.prompt}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-[#5B3FD9] opacity-80 group-hover:opacity-100">
                            <span>Execute Request</span>
                            <Sparkles size={12} className="group-hover:rotate-12 transition-transform" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE CHAT MESSAGES */
              <div className="max-w-3xl mx-auto space-y-6">
                {currentMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div
                      key={msg.id || idx}
                      className={cn(
                        'flex items-start gap-3.5 animate-in fade-in duration-200',
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          'size-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-extrabold text-xs',
                          isUser
                            ? 'bg-[#1E1B3A] text-white'
                            : 'bg-gradient-to-tr from-[#5B3FD9] to-purple-400 text-white'
                        )}
                      >
                        {isUser ? 'YOU' : <Sparkles size={18} />}
                      </div>

                      {/* Message Bubble */}
                      <div className="space-y-1.5 max-w-[85%] sm:max-w-[80%]">
                        <div className="flex items-center gap-2 px-1 text-[10px] text-gray-400 font-semibold">
                          <span>{isUser ? 'You' : 'Trufocus AI'}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={cn(
                            'p-4 rounded-2xl shadow-xs transition-all',
                            isUser
                              ? 'bg-[#5B3FD9] text-white rounded-tr-xs font-medium text-xs leading-relaxed'
                              : 'bg-white border border-[#E5E7EB] text-gray-800 rounded-tl-xs space-y-3'
                          )}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap text-xs font-medium">{msg.content}</p>
                          ) : (
                            <>
                              {msg.content ? (
                                <MarkdownRenderer content={msg.content} />
                              ) : (
                                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 animate-pulse py-1">
                                  <Sparkles size={14} className="animate-spin" />
                                  <span>Thinking & compiling CRM response...</span>
                                </div>
                              )}
                            </>
                          )}

                          {!isUser && !msg.isStreaming && msg.content && (
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-[11px] font-semibold text-gray-500">
                              <button
                                onClick={() => handleCopyMessage(msg.id, msg.content)}
                                className="flex items-center gap-1 hover:text-[#5B3FD9] transition-colors cursor-pointer"
                              >
                                {copiedMsgId === msg.id ? (
                                  <>
                                    <Check size={12} className="text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleRegenerate(idx)}
                                className="flex items-center gap-1 hover:text-[#5B3FD9] transition-colors cursor-pointer"
                              >
                                <RefreshCw size={12} />
                                <span>Regenerate</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* ─── STICKY BOTTOM INPUT BAR ─── */}
        <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
          <div className="max-w-3xl mx-auto relative space-y-2">
            <div className="relative flex items-center bg-[#FAFAFC] rounded-2xl border border-[#E5E7EB] focus-within:border-[#5B3FD9] focus-within:ring-2 focus-within:ring-purple-100 transition-all p-2">
              <input
                type="file"
                ref={chatFileInputRef}
                multiple
                onChange={handleChatFileSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-[#5B3FD9] transition-colors rounded-xl shrink-0 cursor-pointer"
                title="Attach document, contract, or reference image for Trufocus AI"
              >
                <Paperclip size={18} />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  activeMode === 'chat'
                    ? 'Ask Trufocus AI anything about quotations, CRM, work orders, WhatsApp drafts...'
                    : 'Describe the AI artwork or design you want to generate...'
                }
                value={activeMode === 'chat' ? inputMessage : imagePromptInput}
                onChange={(e) => {
                  if (activeMode === 'chat') setInputMessage(e.target.value)
                  else setImagePromptInput(e.target.value)
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 max-h-32 p-2 bg-transparent text-xs text-[#111827] placeholder:text-gray-400 focus:outline-none resize-none font-medium"
              />

              {activeMode === 'chat' ? (
                isGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="px-3.5 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    <Square size={13} className="fill-white" /> Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim()}
                    className="size-10 rounded-xl bg-[#5B3FD9] hover:bg-[#4C34C3] text-white flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send size={16} />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePromptInput.trim()}
                  className="px-4 h-10 rounded-xl bg-gradient-to-r from-[#5B3FD9] to-purple-600 hover:from-[#4C34C3] hover:to-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-40 shadow-md"
                >
                  {isGeneratingImage ? <Sparkles size={15} className="animate-spin" /> : <Wand2 size={15} />}
                  <span>Generate</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-1">
              <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for new line</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-500" /> Endpoint: <code>{activeMode === 'chat' ? '/api/ai/chat' : '/api/ai/image'}</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
