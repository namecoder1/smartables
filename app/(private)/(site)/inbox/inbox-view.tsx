'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { getInboxCustomers, getCustomerMessages, setCustomerBotHandoff, sendHumanMessage } from './actions'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Bot, User, Check, CheckCheck, Loader2, BotOff, MessagesSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatPhoneNumber } from '@/lib/utils'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'
import PageWrapper from '@/components/private/page-wrapper'

interface Customer {
  id: string
  name: string
  phone_number: string
  bot_paused_until: string | null
  latestMessage?: {
    created_at: string
    content: any
    direction: string
    status: string
  }
}

interface Message {
  id: string
  content: any
  direction: 'inbound' | 'outbound_bot' | 'outbound_human'
  status: string
  created_at: string
}

export default function InboxView({ organizationId, faqs }: { organizationId: string, faqs: SanityFaq[] }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 1. Fetch Customers
  const fetchCustomers = async () => {
    const res = await getInboxCustomers(organizationId)
    if (res.success && res.data) {
      setCustomers(res.data)
    }
    setLoadingList(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [organizationId])

  // 2. Fetch Messages when a customer is selected
  useEffect(() => {
    if (!selectedCustomer) return

    const fetchMsgs = async () => {
      setLoadingMessages(true)
      const res = await getCustomerMessages(selectedCustomer.id)
      if (res.success && res.data) {
        setMessages(res.data as Message[])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
      setLoadingMessages(false)
    }

    fetchMsgs()
  }, [selectedCustomer?.id])

  // 3. Realtime Subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp_messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        const newMessage = payload.new as Message

        // Update messages list if it belongs to the current chat
        if (selectedCustomer && newMessage.id && (payload.new as any).customer_id === selectedCustomer.id) {
          setMessages(prev => [...prev, newMessage])
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }

        // Always refresh the customer list to bump the chat up
        fetchCustomers()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `organization_id=eq.${organizationId}`
      }, (payload) => {
        const updatedMsg = payload.new as Message
        if (selectedCustomer && (payload.new as any).customer_id === selectedCustomer.id) {
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, selectedCustomer])

  // Helpers
  const formatTime = (isoSting: string) => format(new Date(isoSting), 'HH:mm', { locale: it })
  const formatDate = (isoSting: string) => format(new Date(isoSting), 'dd MMM', { locale: it })

  const getMessagePreview = (message: any) => {
    if (!message || !message.content) return ''
    if (message.content.type === 'text') return message.content.text
    if (message.content.type === 'button') return `[Pulsante: ${message.content.text}]`
    return '[Media]'
  }

  // Handle Handoff Toggle
  const toggleHandoff = async () => {
    if (!selectedCustomer) return

    const isCurrentlyPaused = selectedCustomer.bot_paused_until && new Date(selectedCustomer.bot_paused_until) > new Date()
    // If paused, unpause (0 hours). If active, pause for 24h.
    const hoursToPause = isCurrentlyPaused ? 0 : 24

    const res = await setCustomerBotHandoff(selectedCustomer.id, hoursToPause)
    if (res.success) {
      const newPausedUntil = res.pausedUntil || null;
      setSelectedCustomer({ ...selectedCustomer, bot_paused_until: newPausedUntil })
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, bot_paused_until: newPausedUntil } : c))
      toast(isCurrentlyPaused ? "Bot Riattivato" : "Bot in Pausa", {
        description: isCurrentlyPaused ? "L'AI ora risponderà in automatico." : "L'AI è stata messa in pausa per 24 ore."
      })
    }
  }

  // Generate initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const isBotPaused = selectedCustomer?.bot_paused_until && new Date(selectedCustomer.bot_paused_until) > new Date()

  return (
    <PageWrapper>
      <div className='flex flex-col sm:flex-row gap-6 items-start sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className="text-3xl font-bold tracking-tight">
            Inbox
          </h1>
          <p className="text-muted-foreground">
            Gestisci le conversazioni WhatsApp e prendi il controllo del Bot AI.
          </p>
        </div>
        <FaqContent title='Aiuto' variant='minimized' faqs={faqs}  />
      </div>
      <div className="flex flex-col md:flex-row h-[calc(100vh-250px)] gap-6">
        {/* Sidebar: Customer List */}
        <Card className="w-full md:w-3/10 2xl:w-2/10 flex py-0 flex-col overflow-hidden gap-0">
          <CardHeader className="border-b-2 py-5 flex items-center gap-3">
            <CardTitle className="text-lg font-bold tracking-tight">
              Conversazioni
            </CardTitle>
          </CardHeader>
          <div className="overflow-y-auto flex-1 p-2">
            {loadingList ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : customers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">Nessuna conversazione trovata.</div>
            ) : (
              customers.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedCustomer?.id === c.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/20 text-primary">{getInitials(c.name || 'Cliente')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 justify-between items-baseline mb-1">
                      <h3 className="font-medium truncate text-sm">{c.name || c.phone_number}</h3>
                      {c.latestMessage && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(c.latestMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 items-center">
                      {c.latestMessage?.direction === 'outbound_bot' && <Bot size={12} className="text-muted-foreground shrink-0" />}
                      {c.latestMessage?.direction === 'outbound_human' && <Check size={12} className="text-muted-foreground shrink-0" />}
                      <p className="text-xs text-muted-foreground truncate">{getMessagePreview(c.latestMessage)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Main Chat Area */}
        <Card className="flex-1 py-0 flex flex-col overflow-hidden relative">
          {selectedCustomer ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex justify-between items-center bg-muted/10">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/20 text-primary">{getInitials(selectedCustomer.name || 'C')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedCustomer.name || 'Cliente Sconosciuto'}</h2>
                    <p className="text-xs text-muted-foreground">{formatPhoneNumber(selectedCustomer.phone_number)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-2 px-3 rounded-xl border">
                  <div className="flex flex-col items-end mr-2 text-right">
                    <Label htmlFor="bot-toggle" className="text-xs font-semibold cursor-pointer">Intervento Umano</Label>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {isBotPaused ? "Messo in pausa" : "Silenzia AI per 24h"}
                    </span>
                  </div>
                  <Switch id="bot-toggle" checked={!!isBotPaused} onCheckedChange={toggleHandoff} />
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                {loadingMessages ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.direction !== 'inbound'
                    const isBot = msg.direction === 'outbound_bot'

                    return (
                      <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {isBot && <span className="text-[10px] text-muted-foreground mb-1 mr-1 flex items-center gap-1"><Bot size={10} /> Automazione Bot</span>}
                        <div className={`max-w-[75%] rounded-2xl p-3 ${isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-white border rounded-tl-sm'
                          }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content?.text || getMessagePreview(msg)}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-1 mx-1">
                          <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                          {isMe && (
                            msg.status === 'read' ? <CheckCheck size={12} className="text-blue-500" /> :
                              msg.status === 'delivered' ? <CheckCheck size={12} className="text-muted-foreground" /> :
                                msg.status === 'sent' ? <Check size={12} className="text-muted-foreground" /> :
                                  <span className="text-[10px] text-muted-foreground italic">Inviato</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t bg-background shrink-0">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!isBotPaused) {
                      toast("Bot Attivo", { description: "Per rispondere devi prima mettere in pausa il Bot." })
                      return;
                    }
                    if (!replyText.trim() || !selectedCustomer) return;
                    setSending(true)
                    const res = await sendHumanMessage(selectedCustomer.id, replyText.trim())
                    setSending(false)
                    if (res.success) {
                      setReplyText('')
                    } else {
                      toast.error("Errore invio", { description: res.error || "Impossibile inviare il messaggio." })
                    }
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={isBotPaused ? "Scrivi un messaggio..." : "Metti in pausa il bot per rispondere manualmente..."}
                    disabled={sending || !isBotPaused}
                  />
                  <Button type="submit" disabled={sending || !replyText.trim() || !isBotPaused} size="icon">
                    {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
              <BotOff size={48} className="text-primary" />
              <div>
                <h3 className="font-medium text-lg text-foreground">Le tue conversazioni</h3>
                <p className="text-sm max-w-sm mt-1">Seleziona una conversazione dalla lista a sinistra per leggere i messaggi e prendere il controllo sul bot AI.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}
