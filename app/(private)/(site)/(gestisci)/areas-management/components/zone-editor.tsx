
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, ZoomIn, ZoomOut, Undo2, Redo2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TABLE_PRESETS } from './table-presets';
import { TablePropertiesPanel } from './table-properties-panel';

import { useZoneEditor } from './zone-editor/use-zone-editor';
import { ZoneLayout } from './zone-editor/ZoneLayout';
import { EditorHelpDialog } from './zone-editor/editor-help-dialog';
import { useZoneColors } from './zone-editor/use-zone-colors';
import { NumberInput } from '@/components/ui/number-input';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      <div className="flex justify-between items-center p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

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
                className="max-w-[200px]"
              />
              <span className="text-gray-400 text-sm">WxH:</span>
              <NumberInput
                className="w-20"
                value={currentZone.width}
                onValueChange={(value) => setCurrentZone(prev => prev ? { ...prev, width: value || 0 } : null)}
                context="default"
              />
              <span className="text-gray-400">x</span>
              <NumberInput
                className="w-20"
                value={currentZone.height}
                onValueChange={(value) => setCurrentZone(prev => prev ? { ...prev, height: value || 0 } : null)}
                context="default"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 group bg-background dark:bg-input/30 h-9 rounded-xl px-2 border cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h2 className="font-semibold text-md">{currentZone.name || 'Nuova Sala'}</h2>
              <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background dark:bg-input/30 rounded-xl border mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="rounded-r-none border-r"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="rounded-l-none"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          <EditorHelpDialog />
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Save className="w-4 h-4" /> {loading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="h-[calc(100vh-145px)] w-full relative overflow-hidden dark:bg-[#1e1e1e] bg-background">

        {/* CANVAS - Absolute Full Screen */}
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

        {/* SIDEBAR - Overlay */}
        {isSidebarOpen && (
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card dark:bg-[#1a1813] border-r flex flex-col z-10 shadow-xl">
            <div className="p-4 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Elementi</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {TABLE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    draggable
                    onDragStart={() => handleSidebarDragStart(preset)}
                    className="flex cursor-grab flex-col items-center gap-2 border bg-card p-4 shadow-sm rounded-xl hover:shadow-md transition-all active:cursor-grabbing hover:border-primary/50"
                  >
                    <div className={`border-2 flex items-center justify-center 
                      ${(preset.type === 'circle' || preset.type === 'plant' || (preset.type === 'column' && preset.radius)) ? 'rounded-full' : ''}
                    `}
                      style={{
                        width: preset.width ? preset.width / 2 : (preset.radius! * 1),
                        height: preset.height ? preset.height / 2 : (preset.radius! * 1),
                        maxWidth: '60px', maxHeight: '60px', minWidth: '20px', minHeight: '20px',
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
                    <span className="text-xs font-medium text-center">{preset.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
