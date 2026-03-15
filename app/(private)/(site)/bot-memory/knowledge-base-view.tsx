'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Edit, Loader2, CircleQuestionMark, BrainCircuit, FileText, BarChart3 } from 'lucide-react'
import { getKnowledgeBase, createKnowledgeBaseEntry, updateKnowledgeBaseEntry, toggleKnowledgeBaseStatus, deleteKnowledgeBaseEntry } from './actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import NoItems from '@/components/utility/no-items'
import OverviewCards from '@/components/private/overview-cards'
import PageWrapper from '@/components/private/page-wrapper'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'

interface OrganizationData {
  organizationId: string
  locationId: string
  kbCharsLimit: number
  initialKbCharsUsed: number
  faqs: SanityFaq[]
}

interface KBEntry {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
}

function pct(used: number, total: number) {
  if (total <= 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

export default function KnowledgeBaseView({ 
  organizationId, 
  locationId, 
  kbCharsLimit, 
  initialKbCharsUsed,
  faqs  
}: OrganizationData) {
  const [entries, setEntries] = useState<KBEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Derived KB usage — recomputed live from entries once loaded, falls back to server value while loading
  const kbCharsUsed = loading
    ? initialKbCharsUsed
    : entries.reduce((sum, e) => sum + e.title.length + e.content.length, 0)
  const usagePct = pct(kbCharsUsed, kbCharsLimit)
  const isAtLimit = kbCharsUsed > kbCharsLimit

  const fetchEntries = async () => {
    setLoading(true)
    const res = await getKnowledgeBase(organizationId)
    if (res.success && res.data) {
      setEntries(res.data as KBEntry[])
    } else {
      toast.error('Errore', { description: 'Impossibile caricare la memoria del bot.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEntries()
  }, [organizationId])

  const handleOpenDialog = (entry?: KBEntry) => {
    if (entry) {
      setEditingEntry(entry)
      setTitle(entry.title)
      setContent(entry.content)
      setIsActive(entry.is_active)
    } else {
      setEditingEntry(null)
      setTitle('')
      setContent('')
      setIsActive(true)
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Campi obbligatori', { description: 'Inserisci un titolo e il contenuto della regola.' })
      return
    }

    setIsSubmitting(true)
    let res;
    if (editingEntry) {
      res = await updateKnowledgeBaseEntry(editingEntry.id, title, content, isActive)
    } else {
      res = await createKnowledgeBaseEntry(organizationId, locationId, title, content)
    }

    if (res.success) {
      toast.success('Salvato', { description: 'La memoria del bot è stata aggiornata con successo.' })
      fetchEntries()
      setIsDialogOpen(false)
    } else {
      toast.error('Errore', { description: 'Impossibile salvare la regola.' })
    }
    setIsSubmitting(false)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e))
    const res = await toggleKnowledgeBaseStatus(id, !currentStatus)
    if (!res.success) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, is_active: currentStatus } : e))
      toast.error('Errore', { description: 'Impossibile modificare lo stato.' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare definitivamente questa regola?')) return
    const res = await deleteKnowledgeBaseEntry(id)
    if (res.success) {
      setEntries(prev => prev.filter(e => e.id !== id))
      toast.success('Eliminato', { description: 'La regola è stata eliminata dalla memoria del bot.' })
    } else {
      toast.error('Errore', { description: 'Impossibile eliminare la regola.' })
    }
  }

  return (
    <PageWrapper>
      <div className='flex items-center justify-between gap-6'>
        <div className='flex flex-col gap-1'>
          <h1 className="text-3xl font-bold tracking-tight">
            Memoria Bot
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci ciò che il tuo bot sa sul tuo locale, istruzioni personalizzate e regole.
          </p>
        </div>
        <FaqContent 
          faqs={faqs}
          variant='minimized' 
          title='Aiuto' 
        />
      </div>
      <div className="space-y-6">
        {/* Overview Cards */}
        <OverviewCards data={[
          {
            title: 'Regole Totali',
            value: loading ? '…' : entries.length,
            description: loading ? '' : `attiv${entries.length > 1 ? 'e' : 'a'}`,
            icon: <FileText className="h-5 w-5 text-primary" />,
          },
          {
            title: 'Caratteri Usati',
            value: kbCharsUsed.toLocaleString('it-IT'),
            description: `su ${kbCharsLimit.toLocaleString('it-IT')}`,
            icon: <BrainCircuit className="h-5 w-5 text-primary" />,
          },
          {
            title: 'Capacità',
            value: `${usagePct}%`,
            description: isAtLimit ? 'limite raggiunto' : 'utilizzata',
            icon: <BarChart3 className="h-5 w-5 text-primary" />,
          },
        ]} />

        <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-4 gap-6 rounded-3xl border-2">
          <div>
            <h3 className="font-semibold text-lg tracking-tight">Istruzioni Aggiuntive</h3>
            <p className="text-sm text-muted-foreground mt-1">Aggiungi regole specifiche, orari, costi extra o FAQ che il Bot AI deve conoscere per rispondere correttamente ai clienti.</p>
          </div>
          <Button
            className='ml-auto'
            onClick={() => handleOpenDialog()}
            disabled={isAtLimit}
            title={isAtLimit ? 'Limite caratteri raggiunto. Acquista un add-on per aggiungere altre regole.' : undefined}
          >
            <Plus className="h-4 w-4" /> Aggiungi Regola
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground h-8 w-8" /></div>
        ) : entries.length === 0 ? (
          <NoItems
            icon={<CircleQuestionMark size={24} />}
            title='Nessuna regola trovata'
            description="L'assistente utilizzerà solo le informazioni di base del locale. Aggiungi regole per personalizzare le sue risposte."
            button={
              <Button variant="outline" onClick={() => handleOpenDialog()} disabled={isAtLimit}>
                Inizia a compilare
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map(entry => (
              <Card key={entry.id} className={`flex flex-col py-4 transition-opacity ${!entry.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <CardHeader className="border-b pb-4! flex flex-row justify-between items-center space-y-0">
                  <CardTitle className="text-base line-clamp-1" title={entry.title}>{entry.title}</CardTitle>
                  <Switch
                    checked={entry.is_active}
                    onCheckedChange={() => handleToggleStatus(entry.id, entry.is_active)}
                  />
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{entry.content}</p>
                </CardContent>
                <div className="px-4 border-t pt-4 flex gap-2 justify-between items-center mt-auto">
                  <p className='capitalize text-xs text-muted-foreground'>
                    Creato: {format(entry.created_at, "d MMMM", { locale: it })}
                  </p>
                  <div className='gap-2 flex items-center'>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => handleOpenDialog(entry)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog for Add/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-150">
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Modifica Regola' : 'Nuova Regola per l\'AI'}</DialogTitle>
              <DialogDescription>
                Fornisci istruzioni chiare e coincise. L'AI userà queste informazioni come fonte di verità quando risponde ai clienti.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titolo / Argomento</Label>
                <Input
                  id="title"
                  placeholder="es. Animali ammessi, Costo coperto, Prezzo Torta..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Dettaglio Regola (Istruzioni esatte per l'AI)</Label>
                <Textarea
                  id="content"
                  placeholder="es. Accettiamo cani di piccola taglia ma solo nella veranda esterna. Bisogna sempre indicarlo nelle note della prenotazione."
                  rows={6}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
              {editingEntry && (
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="active">Attiva e usa per le nuove risposte</Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Annulla</Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salva Modifiche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  )
}
