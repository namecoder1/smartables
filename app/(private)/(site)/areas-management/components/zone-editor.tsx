
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, ZoomIn, ZoomOut, Undo2, Redo2, ChevronDown, MoreHorizontal, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TABLE_PRESETS, PresetCategory } from './table-presets';
import { TablePropertiesPanel } from './table-properties-panel';

import { useZoneEditor } from './zone-editor/use-zone-editor';
import { ZoneLayout } from './zone-editor/ZoneLayout';
import { EditorHelpDialog } from './zone-editor/editor-help-dialog';
import { useZoneColors } from './zone-editor/use-zone-colors';
import { NumberInput } from '@/components/ui/number-input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { FaSpinner } from 'react-icons/fa6';

interface ZoneEditorProps {
  initialZoneId?: string;
  onBack?: () => void;
  onSaveSuccess?: () => void;
  locationSlug?: string;
}

export default function ZoneEditor({ initialZoneId, onBack, onSaveSuccess, locationSlug }: ZoneEditorProps) {
  const colors = useZoneColors();
  const {
    tables, setTables,
    currentZone, setCurrentZone,
    selectedId, setSelectedId,
    loading,
    guides,
    drawingWall, setDrawingWall,
    handleSave,
    handleDragMove,
    handleDragEnd,
    handleSidebarDragStart,
    handleCanvasDrop,
    deleteTable,
    rotateTable,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useZoneEditor(initialZoneId, onSaveSuccess);

  // UI State that didn't need to be in the complex hook
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);

  // Viewport State
  const [stageDimensions, setStageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-Center
  useEffect(() => {
    if (stageDimensions.width > 0 && currentZone) {
      const scaleX = (stageDimensions.width - 100) / currentZone.width;
      const scaleY = (stageDimensions.height - 100) / currentZone.height;
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.0);
      setScale(newScale);
      const centerX = (stageDimensions.width - currentZone.width * newScale) / 2;
      const centerY = (stageDimensions.height - currentZone.height * newScale) / 2;
      setPosition({ x: centerX, y: centerY });
    }
  }, [stageDimensions.width, stageDimensions.height, currentZone?.id]);


  if (!mounted) return null;
  if (loading && !currentZone) return <div className="p-8 text-center text-gray-500">Caricamento...</div>;
  if (!currentZone) return <div className="p-8 text-center text-gray-500">Nessuna sala trovata.</div>;

  return (
    <div className="flex h-full flex-col">
      {/* TOOLBAR */}
      <div className="flex justify-between items-center px-6 py-4 border-b shrink-0 bg-card">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Mappa</h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* View Modes */}
          <div className="hidden md:flex items-center bg-muted/30 p-1 rounded-xl border">
            <Button variant="ghost" size="sm" className="bg-background shadow-xs h-8 rounded-lg px-4 text-sm font-semibold">2D piano</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:text-foreground">360° panorama</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:text-foreground">Descrizione</Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                <Undo2 className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
                <Redo2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9 border rounded-xl bg-muted/30">
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            <Button variant="outline" className="rounded-xl h-9" onClick={onBack}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader className='animate-spin' /> : <Save className="w-4 h-4" />}
              Salva
            </Button>
          </div>
        </div>
      </div>

      {/* SUB-TOOLBAR FOR NAME/SIZE EDITING */}
      <div className="px-6 py-2 bg-muted/10 border-b flex items-center gap-2 shrink-0">
        {isEditingName ? (
          <div
            className="flex items-center gap-2"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsEditingName(false);
              }
            }}
          >
            <Input
              autoFocus value={currentZone.name || ''}
              onChange={(e) => setCurrentZone(prev => prev ? { ...prev, name: e.target.value } : null)}
              onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }}
              className="max-w-50 h-8 text-sm"
            />
            <span className="text-gray-400 text-xs font-medium ml-2">DIMENSIONI:</span>
            <NumberInput
              buttonHeight="h-4.5"
              className="w-20 text-sm"
              value={currentZone.width}
              onValueChange={(value) => setCurrentZone(prev => prev ? { ...prev, width: value || 0 } : null)}
              context="default"
            />
            <span className="text-gray-400 text-xs">x</span>
            <NumberInput
              className="w-20 text-sm"
              buttonHeight="h-4.5"
              value={currentZone.height}
              onValueChange={(value) => setCurrentZone(prev => prev ? { ...prev, height: value || 0 } : null)}
              context="default"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 group h-8 cursor-pointer px-2 -ml-2 rounded-md hover:bg-muted/50" onClick={() => setIsEditingName(true)}>
            <h2 className="font-medium text-sm text-muted-foreground">{currentZone.name || 'Nuova Sala'}</h2>
            <span className="text-xs text-muted-foreground/50">({currentZone.width}x{currentZone.height})</span>
            <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* CONTENT: Sidebar + Canvas */}
      <div className="flex flex-1 overflow-hidden bg-muted/5">

        {/* SIDEBAR - Static Left */}
        {isSidebarOpen && (
          <div className="w-75 bg-card border-r flex flex-col z-10 shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <Accordion type="multiple" defaultValue={['Tavoli', 'Muri']} className="w-full space-y-3">
                {(['Tavoli', 'Sedute', 'Decorazioni', 'Muri', 'Pavimenti', 'Segnalini'] as PresetCategory[]).map((category) => {
                  const items = TABLE_PRESETS.filter(p => p.category === category);
                  if (items.length === 0) return null;

                  return (
                    <AccordionItem key={category} value={category} className="border-none">
                      <AccordionTrigger className="hover:no-underline py-3 px-4 rounded-xl border bg-background hover:bg-muted/30 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 transition-all font-semibold shadow-sm text-sm">
                        {category}
                      </AccordionTrigger>
                      <AccordionContent className="border border-t-0 rounded-b-xl p-4 bg-muted/10 shadow-sm">
                        <div className="grid grid-cols-2 gap-3">
                          {items.map((preset) => (
                            <div
                              key={preset.id}
                              draggable
                              onDragStart={() => handleSidebarDragStart(preset)}
                              className="flex cursor-grab flex-col items-center gap-3 border bg-card p-3 shadow-sm rounded-xl hover:shadow-md transition-all active:cursor-grabbing hover:border-orange-500/50"
                            >
                              <div className={`border-2 flex items-center justify-center 
                                ${(preset.type === 'circle' || preset.type === 'plant' || (preset.type === 'column' && preset.radius)) ? 'rounded-full' : 'rounded-md'}
                              `}
                                style={{
                                  width: preset.width ? Math.min(preset.width / 2, 45) : (preset.radius! * 1),
                                  height: preset.height ? Math.min(preset.height / 2, 45) : (preset.radius! * 1),
                                  minWidth: '24px', minHeight: '24px',
                                  backgroundColor:
                                    preset.type === 'plant' ? colors.plantFill :
                                      preset.type === 'wall' ? colors.wallFill :
                                        preset.type === 'door' ? colors.doorFill :
                                          preset.type === 'column' ? colors.columnFill :
                                            preset.type === 'booth' ? colors.boothFill :
                                              preset.type === 'counter' ? colors.counterFill :
                                                colors.tableFill,
                                  borderColor:
                                    preset.type === 'plant' ? colors.plantStroke :
                                      preset.type === 'wall' ? colors.wallStroke :
                                        preset.type === 'door' ? colors.doorStroke :
                                          preset.type === 'column' ? colors.columnStroke :
                                            preset.type === 'booth' ? colors.boothStroke :
                                              preset.type === 'counter' ? colors.counterStroke :
                                                colors.tableStroke,
                                }}
                              />
                              <span className="text-[11px] font-medium text-center leading-tight text-muted-foreground">{preset.label}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          </div>
        )}

        {/* CANVAS AREA */}
        <div className="flex-1 relative overflow-hidden dark:bg-[#1e1e1e] bg-background">
          <div className="absolute inset-0 z-0">
            <ZoneLayout
              currentZone={currentZone}
              tables={tables}
              guides={guides}
              selectedId={selectedId}
              drawingWall={drawingWall}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onDrop={handleCanvasDrop}
              onSelect={setSelectedId}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDelete={deleteTable}
              onRotate={rotateTable}
              onUpdateTables={setTables}
              setDrawingWall={setDrawingWall}
              stageParams={{
                scale, setScale,
                x: position.x,
                y: position.y,
                setPosition,
                stageDimensions,
                setStageDimensions
              }}
            />
            <div className="absolute flex bg-white dark:bg-input/30 border-2 rounded-xl items-center bottom-4 right-4 z-20 gap-2">
              <Button variant="ghost" size="icon" className='border-r-2 rounded-r-none' onClick={() => setScale(s => Math.max(0.2, s - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
              <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className='border-l-2 rounded-l-none' onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        {/* FLOAT PANELS */}
        {selectedId && (() => {
          const selectedTable = tables.find(t => t.uniqueId === selectedId);
          if (!selectedTable) return null;
          return (
            <TablePropertiesPanel
              table={selectedTable}
              onUpdate={(id, updates) => {
                setTables(prev => prev.map(t => t.uniqueId === id ? { ...t, ...updates } : t));
              }}
              onClose={() => setSelectedId(null)}
              onDelete={deleteTable}
              locationSlug={locationSlug}
            />
          );
        })()}

      </div>
    </div>
  );
}
