"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from 'lucide-react';

import { TableShape } from "./table-presets"
import { NumberInput } from "@/components/ui/number-input"

// Define the interface locally if not available from a shared type file yet, 
// matching what's in ZoneEditor
interface TableInstance {
  uniqueId: string;
  label: string;
  seats: number;
  min_capacity?: number;
  max_capacity?: number;
  type: TableShape;
  width?: number;
  height?: number;
  radius?: number;
}

interface TablePropertiesPanelProps {
  table: TableInstance;
  onUpdate: (id: string, updates: Partial<TableInstance>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  locationSlug?: string;
}

export function TablePropertiesPanel({ table, onUpdate, onClose, onDelete, locationSlug }: TablePropertiesPanelProps) {
  // Refined check: 'counter' and 'booth' MIGHT be seatable if they have seats > 0.
  // Let's stick to a positive list or a more robust negative list.
  // Based on presets: 
  // Non-seatables: wall, door, column, text, cashier, restroom, plant.
  // Seatables: rect, circle, booth, counter.
  const isInteractiveTable = ['rect', 'circle', 'booth', 'counter'].includes(table.type);

  // Generate options for dropdowns
  const minOptions = Array.from({ length: Math.max(table.seats, 1) }, (_, i) => i + 1);
  // Max options: from seats up to seats + 4 (arbitrary limit for squeeze)
  const maxOptions = Array.from({ length: 5 }, (_, i) => table.seats + i);

  return (
    <div className="absolute top-52 right-5 w-64 rounded-xl bg-card border shadow-lg p-4 z-50 animate-in slide-in-from-right-10 fade-in duration-200 overflow-y-auto max-h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm">Proprietà</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="table-label" className="text-xs">Etichetta</Label>
          <Input
            id="table-label"
            value={table.label}
            onChange={(e) => onUpdate(table.uniqueId, { label: e.target.value })}
            className="h-8"
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-2">
          {/* Rectangular / Sizable Items */}
          {(table.type !== 'circle' && table.type !== 'plant' && table.type !== 'restroom' && table.type !== 'cashier' && table.type !== 'text' && (!['column'].includes(table.type) || (table.type === 'column' && !table.radius))) && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Largh.</Label>
                <NumberInput
                  value={table.width}
                  onValueChange={(val) => onUpdate(table.uniqueId, { width: val || 10 })}
                  className="h-9"
                  buttonHeight="h-4.5"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Alt.</Label>
                <NumberInput
                  value={table.height}
                  onValueChange={(val) => onUpdate(table.uniqueId, { height: val || 10 })}
                  className="h-9"
                  buttonHeight="h-4.5"
                />
              </div>
            </>
          )}

          {/* Circular Items */}
          {(table.type === 'circle' || table.type === 'plant' || (table.type === 'column' && !!table.radius)) && (
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-muted-foreground">Raggio</Label>
              <Input
                type="number"
                value={table.radius}
                onChange={(e) => onUpdate(table.uniqueId, { radius: parseInt(e.target.value) || 10 })}
                className="h-8"
              />
            </div>
          )}
        </div>

        {isInteractiveTable && (
          <>
            {/* Standard Seats (Read-onlyish or main control) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Posti Standard</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={table.seats}
                  onValueChange={(val) => {
                    const newVal = val || 1;
                    onUpdate(table.uniqueId, {
                      seats: newVal,
                      max_capacity: Math.max(newVal, table.max_capacity || newVal),
                      min_capacity: Math.min(newVal, table.min_capacity || 1)
                    });
                  }}
                  className="h-9"
                  buttonHeight="h-4.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Min Capacity */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Minimo</Label>
                <Select
                  value={String(table.min_capacity || 1)}
                  onValueChange={(val) => onUpdate(table.uniqueId, { min_capacity: parseInt(val) })}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minOptions.map(num => (
                      <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Capacity */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Massimo</Label>
                <Select
                  value={String(table.max_capacity || table.seats)}
                  onValueChange={(val) => onUpdate(table.uniqueId, { max_capacity: parseInt(val) })}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maxOptions.map(num => (
                      <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <div className="pt-2 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full h-8"
            onClick={() => onDelete(table.uniqueId)}
          >
            Elimina Elemento
          </Button>
        </div>
      </div>
    </div>
  )
}
