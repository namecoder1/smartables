'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Plus,
  X,
  Layers,
  Save,
  Info,
} from 'lucide-react'
import { MenuCategory } from '@/types/general'
import PageWrapper from '@/components/private/page-wrapper'
import { NumberInput } from '@/components/ui/number-input'
import {
  PROMO_TYPES,
  VALUE_LABELS,
  TARGET_TYPES,
  type PromotionEditViewProps,
} from './_components/promotion-types'
import { usePromotionForm } from './_components/use-promotion-form'
import { ImageUpload } from '@/components/private/image-upload'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import SetPageTitle from '@/components/private/set-page-title'
import EditCard from '@/components/utility/edit-card'

const PromotionEditView = ({ promotion, locations, menus, organizationId, isNew }: PromotionEditViewProps) => {
  const {
    name, setName,
    description, setDescription,
    imageFile, setImageFile,
    imagePreview, setImagePreview,
    type, setType,
    value, setValue,
    allLocations, setAllLocations,
    selectedLocationIds, setSelectedLocationIds,
    allMenus, setAllMenus,
    selectedMenuIds, setSelectedMenuIds,
    startsAt, setStartsAt,
    endsAt, setEndsAt,
    visitThreshold, setVisitThreshold,
    isActive, setIsActive,
    priority, setPriority,
    stackable, setStackable,
    notifyWhatsapp, setNotifyWhatsapp,
    items,
    addItem,
    removeItem,
    updateItem,
    allCategories,
    allMenuItems,
    saving,
    deleting,
    handleSave,
    handleDelete,
    router,
  } = usePromotionForm({ promotion, menus, organizationId, isNew })

  const currentValueConfig = VALUE_LABELS[type]
  const selectedPromoType = PROMO_TYPES.find((pt) => pt.value === type)

  return (
    <PageWrapper>
      {!isNew && name && (<SetPageTitle title={name} description="Modifica promozione" />)}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/promotions')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isNew ? 'Nuova Promozione' : 'Modifica Promozione'}
            </h2>
            <p className="text-muted-foreground">
              {isNew
                ? 'Crea una promozione per attirare clienti e aumentare le vendite.'
                : `Stai modificando "${promotion?.name}".`}
            </p>
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Elimina
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Crea Promozione' : 'Salva Modifiche'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <EditCard
            title='Nome e descrizione'
            description='Come apparirà la promozione ai tuoi clienti nella pagina del menù.'
          >
            <div className="space-y-2">
              <Label htmlFor="promo-name">Nome promozione *</Label>
              <Input
                id="promo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es: Menu Pranzo Primavera, Pizza Day, Happy Hour"
              />
              <Hint>Usa un nome breve e accattivante. Sarà il titolo visibile ai clienti.</Hint>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-desc">Descrizione</Label>
              <Textarea
                id="promo-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="es: Ogni martedì, menu completo a prezzo fisso con primo, secondo e dolce del giorno!"
              />
              <Hint>Spiega in poche parole cosa include la promozione. I clienti la vedranno sulla pagina del menù.</Hint>
            </div>
            <ImageUpload
              value={imagePreview}
              onChange={(url, file) => {
                setImagePreview(url)
                setImageFile(file || null)
              }}
              title="Immagine promozione"
              aspect="video"
            />
            <Hint>Immagine opzionale che apparirà accanto alla promozione. Formato consigliato: 16:9, max 5MB.</Hint>
          </EditCard>
          <EditCard 
            title='Tipo di sconto'
            description='Scegli come funziona lo sconto. Ogni tipo cambia il significato del valore che inserisci.'
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PROMO_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${type === pt.value
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 bg-background'
                    }`}
                >
                  <div className={`p-2.5 rounded-xl ${type === pt.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {pt.icon}
                  </div>
                  <span className="text-sm font-semibold">{pt.label}</span>
                </button>
              ))}
            </div>

            {/* Example Box */}
            {selectedPromoType && (
              <div className="flex items-start gap-3 rounded-xl border bg-primary/5 border-primary/15 p-3 animate-in fade-in-50 duration-200">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/80">{selectedPromoType.example}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="promo-value">{currentValueConfig.label}</Label>
              <NumberInput
                id="promo-value"
                value={value}
                onValueChange={setValue}
                placeholder={currentValueConfig.placeholder}
                context="default"
                buttonHeight="h-4.5"
              />
              <Hint>{currentValueConfig.hint}</Hint>
            </div>

          </EditCard>
          <EditCard
            title='Dove si applica'
            description='Scegli in quali sedi e su quali menù sarà visibile questa promozione.'
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Sedi</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allLocations
                      ? 'La promozione sarà attiva in tutte le tue sedi.'
                      : `Seleziona le sedi dove attivare la promozione (${selectedLocationIds.length} selezionate).`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">Tutte</span>
                  <Switch checked={allLocations} onCheckedChange={setAllLocations} />
                </div>
              </div>
              {!allLocations && (
                <div className="grid gap-2 border rounded-xl p-3 max-h-48 overflow-y-auto bg-background animate-in fade-in-50 zoom-in-95">
                  {locations.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center">Nessuna sede disponibile. Crea prima una sede.</p>
                  ) : locations.map((loc) => (
                    <div key={loc.id} className="flex items-center gap-2 py-0.5">
                      <Checkbox
                        id={`loc-${loc.id}`}
                        checked={selectedLocationIds.includes(loc.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLocationIds([...selectedLocationIds, loc.id])
                          } else {
                            setSelectedLocationIds(selectedLocationIds.filter((id) => id !== loc.id))
                          }
                        }}
                      />
                      <Label htmlFor={`loc-${loc.id}`} className="cursor-pointer text-sm font-normal flex items-center gap-2">
                        {loc.name}
                        {loc.address && <span className="text-xs text-muted-foreground">· {loc.address}</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Menus */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Menù</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {allMenus
                      ? 'La promozione apparirà su tutti i tuoi menù.'
                      : `Seleziona i menù interessati (${selectedMenuIds.length} selezionati).`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">Tutti</span>
                  <Switch checked={allMenus} onCheckedChange={setAllMenus} />
                </div>
              </div>
              {!allMenus && (
                <div className="grid gap-2 border rounded-xl p-3 max-h-48 overflow-y-auto bg-background animate-in fade-in-50 zoom-in-95">
                  {menus.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center">Nessun menù disponibile. Crea prima un menù.</p>
                  ) : menus.map((menu) => (
                    <div key={menu.id} className="flex items-center gap-2 py-0.5">
                      <Checkbox
                        id={`menu-${menu.id}`}
                        checked={selectedMenuIds.includes(menu.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMenuIds([...selectedMenuIds, menu.id])
                          } else {
                            setSelectedMenuIds(selectedMenuIds.filter((id) => id !== menu.id))
                          }
                        }}
                      />
                      <Label htmlFor={`menu-${menu.id}`} className="cursor-pointer text-sm font-normal flex items-center gap-2">
                        {menu.name}
                        {!menu.is_active && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Inattivo</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </EditCard>
          <EditCard
            hasGuide={type === 'bundle'}
            guideTitle='Come funziona il bundle?'
            guideDescription='Aggiungi gli elementi e scegli condizione (es: ordina per attivare) e target (scontato o incluso nel prezzo)'
            title='Cosa viene scontato'
            description='Aggiungi i piatti, le categorie o il menù intero coinvolti nella promozione.'
          >
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <Layers className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Nessun elemento aggiunto</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {type === 'cover_override'
                    ? 'Per le promozioni sul coperto non è necessario aggiungere elementi.'
                    : 'Clicca "Aggiungi" per specificare su cosa si applica lo sconto.'}
                </p>
              </div>
            )}

            {items.map((item, idx) => (
              <div
                key={item._key}
                className="space-y-3 animate-in fade-in-50 zoom-in-95"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Elemento {idx + 1}
                  </span>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => removeItem(item._key)}
                  >
                    <X className="w-3.5 h-3.5" /> Rimuovi
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Target Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cosa sconti?</Label>
                    <Select
                      value={item.target_type}
                      onValueChange={(v) => updateItem(item._key, 'target_type', v)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_TYPES.map((tt) => (
                          <SelectItem key={tt.value} value={tt.value}>
                            <div>
                              <span>{tt.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">{tt.hint}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Ref — data-driven selectors */}
                  {item.target_type === 'menu_item' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quale piatto?</Label>
                      <Select
                        value={item.target_ref || ''}
                        onValueChange={(v) => updateItem(item._key, 'target_ref', v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Seleziona un piatto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allMenuItems.length === 0 ? (
                            <SelectItem value="__empty" disabled>Nessun piatto nei menù</SelectItem>
                          ) : (
                            menus.map((menu) => {
                              const content = (menu.content || []) as MenuCategory[]
                              const menuItemsList = content.flatMap((cat) =>
                                (cat.items || []).map((mi) => ({ ...mi, categoryName: cat.name }))
                              )
                              if (menuItemsList.length === 0) return null
                              return (
                                <SelectGroup key={menu.id}>
                                  <SelectLabel className="text-xs font-semibold text-muted-foreground">{menu.name}</SelectLabel>
                                  {menuItemsList.map((mi) => (
                                    <SelectItem key={mi.id} value={mi.id}>
                                      <span>{mi.name}</span>
                                      <span className="text-xs text-muted-foreground ml-1">· {mi.categoryName} · {mi.price}€</span>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {item.target_type === 'category' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quale categoria?</Label>
                      <Select
                        value={item.target_ref || ''}
                        onValueChange={(v) => updateItem(item._key, 'target_ref', v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Seleziona una categoria..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.length === 0 ? (
                            <SelectItem value="__empty" disabled>Nessuna categoria nei menù</SelectItem>
                          ) : (
                            menus.map((menu) => {
                              const content = (menu.content || []) as MenuCategory[]
                              if (content.length === 0) return null
                              return (
                                <SelectGroup key={menu.id}>
                                  <SelectLabel className="text-xs font-semibold text-muted-foreground">{menu.name}</SelectLabel>
                                  {content.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                      <span className="text-xs text-muted-foreground ml-1">· {(cat.items || []).length} piatti</span>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {item.target_type === 'full_menu' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quale menù?</Label>
                      <Select
                        value={item.target_ref || ''}
                        onValueChange={(v) => updateItem(item._key, 'target_ref', v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Seleziona un menù..." />
                        </SelectTrigger>
                        <SelectContent>
                          {menus.length === 0 ? (
                            <SelectItem value="__empty" disabled>Nessun menù disponibile</SelectItem>
                          ) : (
                            menus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                {menu.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Role — important for bundles */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ruolo nella promozione</Label>
                    <Select
                      value={item.role}
                      onValueChange={(v) => updateItem(item._key, 'role', v)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="target">
                          🎯 Scontato — questo elemento viene scontato
                        </SelectItem>
                        <SelectItem value="condition">
                          🔗 Condizione — serve per attivare la promo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Override */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sconto specifico (opzionale)</Label>
                    <Select
                      value={item.override_type || 'none'}
                      onValueChange={(v) =>
                        updateItem(item._key, 'override_type', v === 'none' ? null : v)
                      }
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Usa lo sconto della promozione</SelectItem>
                        <SelectItem value="percentage">Sconto % personalizzato</SelectItem>
                        <SelectItem value="fixed_amount">Sconto € personalizzato</SelectItem>
                        <SelectItem value="free">Gratuito</SelectItem>
                      </SelectContent>
                    </Select>
                    <Hint>Lascia su &quot;Usa lo sconto della promozione&quot; per applicare lo sconto generale.</Hint>
                  </div>
                </div>
              </div>
            ))}

            {type !== 'cover_override' && (
              <Button variant="outline" className="w-full" onClick={addItem}>
                <Plus className="w-4 h-4" /> Aggiungi elemento
              </Button>
            )}
          </EditCard>
        </div>

        <div className="space-y-6">
          <EditCard
            title='Stato'
            description='Controlla visibilità e comportamento della promozione.'
          > 
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-active" className="cursor-pointer font-medium">Promozione attiva</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se attiva, la promozione è visibile ai clienti.
                </p>
              </div>
              <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="border-t" />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="stackable" className="cursor-pointer font-medium">Cumulabile</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se attivo, questa promo si somma ad altre attive nello stesso momento.
                </p>
              </div>
              <Switch id="stackable" checked={stackable} onCheckedChange={setStackable} />
            </div>

            <div className="border-t" />

            <div className="space-y-2">
              <Label className="font-medium">Priorità</Label>
              <NumberInput
                value={priority}
                onValueChange={setPriority}
                placeholder="0"
                context="default"
                buttonHeight="h-4.5"
              />
              <Hint>In caso di conflitto tra promozioni (stesso piatto, stesse date), la promozione con priorità più alta prevale. Lascia 0 se non rilevante.</Hint>
            </div>
          </EditCard>
          <EditCard
            title='Periodo di validità'
            description='Imposta quando la promozione è attiva. Lascia vuoto per sempre attiva.'
          >
            <DateTimePicker
              value={startsAt}
              onChange={setStartsAt}
              dateLabel="Data inizio"
              timeLabel="Ora inizio"
            />
            <DateTimePicker
              value={endsAt}
              onChange={setEndsAt}
              dateLabel="Data fine"
              timeLabel="Ora fine"
            />
            <Hint>
              Se imposti solo l&apos;inizio, la promozione sarà attiva a partire da quella data senza scadenza. Se imposti solo la fine, partirà subito e scadrà a quella data.
            </Hint>
          </EditCard>
          <EditCard
            title='Fedeltà cliente'
            description='Attiva la promozione automaticamente dopo un certo numero di visite.'
          >
            <div className="space-y-2">
              <Label>Ogni quante visite?</Label>
              <NumberInput
                value={visitThreshold}
                onValueChange={setVisitThreshold}
                placeholder="es: 5"
                context="default"
                buttonHeight="h-4.5"
              />
              <Hint>
                Esempio: se imposti 5, la promozione si attiverà alla 5ª, 10ª, 15ª visita, ecc. Lascia vuoto per disabilitare.
              </Hint>
            </div>
          </EditCard>
          <EditCard
            title='Notifiche'
            description='Invia la promozione direttamente ai tuoi clienti.'
          >
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-wa" className="cursor-pointer font-medium">WhatsApp</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invia un messaggio WhatsApp ai clienti per annunciare la promozione.
                </p>
              </div>
              <Switch id="notify-wa" checked={notifyWhatsapp} onCheckedChange={setNotifyWhatsapp} />
            </div>
          </EditCard>
        </div>
      </div>

      <div className="flex xl:hidden items-center gap-2 sticky bottom-0 bg-[#eeeeee] py-4 border-t -mx-6 px-6 -mb-6">
        {!isNew && (
          <Button variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Elimina
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isNew ? 'Crea Promozione' : 'Salva Modifiche'}
        </Button>
      </div>
    </PageWrapper>
  )
}

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{children}</p>
)

export default PromotionEditView
