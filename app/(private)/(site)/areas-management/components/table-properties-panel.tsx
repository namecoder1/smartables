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
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X } from 'lucide-react';
import Link from 'next/link';

import { TableShape } from "./table-presets"
import { NumberInput } from "@/components/ui/number-input"
import { isDev } from "@/lib/utils"

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
  // Only show capacity controls and QR codes for seatable items (actual tables)
  // Exclude structural/decorative elements
  const isSeatable = table.seats > 0 && !['wall', 'plant', 'door', 'column', 'text', 'cashier', 'restroom', 'booth', 'counter'].includes(table.type) || (table.type === 'counter' || table.type === 'booth');

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

  const qrUrl = locationSlug && table.uniqueId && isDev() ?
    `http://localhost:3000/order/${locationSlug}/${table.uniqueId}` :
    `https://smartables.it/order/${locationSlug}/${table.uniqueId}`;

  const handlePrintQr = () => {
    if (!qrUrl) return;

    // Create a hidden iframe or window to print just this QR
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Stampa QR - ${table.label}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: sans-serif;
              }
              .qr-container {
                text-align: center;
                border: 2px dashed #000;
                padding: 40px;
                border-radius: 20px;
              }
              h1 { margin-bottom: 20px; font-size: 32px; }
              p { margin-top: 20px; font-size: 14px; color: #555; }
              .cta { margin-top: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>${table.label}</h1>
              ${document.getElementById(`qr-code-${table.uniqueId}`)?.outerHTML || ''}
              <p>${qrUrl}</p>
              <div class="cta">Scansiona per ordinare</div>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

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
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Alt.</Label>
                <NumberInput
                  value={table.height}
                  onValueChange={(val) => onUpdate(table.uniqueId, { height: val || 10 })}
                  className="h-9"
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

        {isInteractiveTable && locationSlug && qrUrl && (
          <div className="pt-4 border-t space-y-2">
            <Label className="text-xs font-semibold">QR Code Tavolo</Label>
            <div className="flex justify-center bg-white p-2 border rounded-md">
              <QRCodeSVG
                id={`qr-code-${table.uniqueId}`}
                value={qrUrl}
                size={120}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => window.open(qrUrl, '_blank')}>
                Apri Menu
              </Button>
              <Button size="sm" className="flex-1 h-8 text-xs" onClick={handlePrintQr}>
                <Printer className="w-3 h-3 mr-1" /> Stampa
              </Button>
            </div>
          </div>
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
