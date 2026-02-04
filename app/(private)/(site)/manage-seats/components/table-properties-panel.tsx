"use client"

import * as React from "react"
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
import { X } from "lucide-react"

import { TableShape } from "./table-presets"

// Define the interface locally if not available from a shared type file yet, 
// matching what's in ZoneEditor
interface TableInstance {
  uniqueId: string;
  label: string;
  seats: number;
  min_capacity?: number;
  max_capacity?: number;
  type: TableShape;
}

interface TablePropertiesPanelProps {
  table: TableInstance;
  onUpdate: (id: string, updates: Partial<TableInstance>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function TablePropertiesPanel({ table, onUpdate, onClose, onDelete }: TablePropertiesPanelProps) {
  // Only show capacity controls for seatable items
  const isSeatable = table.seats > 0 && !['wall', 'plant', 'door', 'column'].includes(table.type);

  // Generate options for dropdowns
  const minOptions = Array.from({ length: Math.max(table.seats, 1) }, (_, i) => i + 1);
  // Max options: from seats up to seats + 4 (arbitrary limit for squeeze)
  const maxOptions = Array.from({ length: 5 }, (_, i) => table.seats + i);

  return (
    <div className="absolute top-4 right-4 w-64 bg-card border rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-right-10 fade-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm">Proprietà</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div className="space-y-1.5">
          <Label htmlFor="table-label" className="text-xs">Etichetta</Label>
          <Input
            id="table-label"
            value={table.label}
            onChange={(e) => onUpdate(table.uniqueId, { label: e.target.value })}
            className="h-8"
          />
        </div>

        {isSeatable && (
          <>
            {/* Standard Seats (Read-onlyish or main control) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Posti Standard</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={table.seats}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    onUpdate(table.uniqueId, {
                      seats: val,
                      // Reset min/max if they become invalid? For now let's keep it simple
                      max_capacity: Math.max(val, table.max_capacity || val),
                      min_capacity: Math.min(val, table.min_capacity || 1)
                    });
                  }}
                  className="h-8"
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
