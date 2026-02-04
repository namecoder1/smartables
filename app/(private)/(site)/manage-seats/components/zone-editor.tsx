
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Save, ZoomIn, ZoomOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TABLE_PRESETS } from './table-presets';
import { TablePropertiesPanel } from './table-properties-panel';

import { useZoneEditor } from './zone-editor/use-zone-editor';
import { ZoneLayout } from './zone-editor/ZoneLayout';
import { EditorHelpDialog } from './zone-editor/editor-help-dialog';

interface ZoneEditorProps {
  initialZoneId?: string;
  onBack?: () => void;
  onSaveSuccess?: () => void;
}

export default function ZoneEditor({ initialZoneId, onBack, onSaveSuccess }: ZoneEditorProps) {
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
    <div className="flex h-full flex-col bg-background">
      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-background dark:bg-card p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus value={currentZone.name || ''}
                onChange={(e) => setCurrentZone(prev => prev ? { ...prev, name: e.target.value } : null)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }}
                className="max-w-[200px]"
              />
              <span className="text-gray-400 text-sm">WxH:</span>
              <Input type="number" className="w-20" value={currentZone.width} onChange={(e) => setCurrentZone(prev => prev ? { ...prev, width: Number(e.target.value) } : null)} />
              <span className="text-gray-400">x</span>
              <Input type="number" className="w-20" value={currentZone.height} onChange={(e) => setCurrentZone(prev => prev ? { ...prev, height: Number(e.target.value) } : null)} />
            </div>
          ) : (
            <div className="flex items-center gap-2 group bg-background h-9 px-2 border cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h2 className="font-semibold text-md">{currentZone.name || 'Nuova Sala'}</h2>
              <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <EditorHelpDialog />
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Save className="w-4 h-4" /> {loading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="h-[calc(100vh-145px)] w-full relative overflow-hidden">

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
          <div className="absolute flex bg-white border items-center bottom-4 right-4 z-20 gap-2">
            <Button variant="ghost" size="icon" className='border-r' onClick={() => setScale(s => Math.max(0.2, s - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className='border-l' onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* SIDEBAR - Overlay */}
        {isSidebarOpen && (
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r flex flex-col z-10 shadow-xl">
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
                    className="flex cursor-grab flex-col items-center gap-2 rounded-lg border bg-background p-4 shadow-sm hover:shadow-md transition-all active:cursor-grabbing hover:border-primary/50"
                  >
                    <div className={`border-2 border-foreground/80 flex items-center justify-center 
                      ${(preset.type === 'circle' || preset.type === 'plant' || (preset.type === 'column' && preset.radius)) ? 'rounded-full' : ''}
                      ${preset.type === 'plant' ? 'border-green-500 bg-green-500/20' : ''}
                      ${(preset.type === 'wall' || preset.type === 'door' || preset.type === 'column') ? 'bg-zinc-800 border-zinc-900 dark:bg-zinc-500' : ''}
                    `}
                      style={{
                        width: preset.width ? preset.width / 2 : (preset.radius! * 1),
                        height: preset.height ? preset.height / 2 : (preset.radius! * 1),
                        maxWidth: '60px', maxHeight: '60px', minWidth: '20px', minHeight: '20px',
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
            />
          );
        })()}

      </div>
    </div>
  );
}
