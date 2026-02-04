'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text } from 'react-konva';
import { useTheme } from 'next-themes';
import { getFloorPlan } from '@/app/actions/floor-plan';
import { toast } from 'sonner';
import { Booking } from '@/types/general';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { assignBookingToTable, updateBooking, unassignBooking } from '@/app/actions/booking-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


interface ReservationsFloorPlanProps {
  locationId: string;
  bookings: Booking[];
  onAssignmentChange?: () => void;
}

export default function ReservationsFloorPlan({ locationId, bookings, onAssignmentChange }: ReservationsFloorPlanProps) {
  const { theme, systemTheme } = useTheme();
  const [zones, setZones] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [currentZone, setCurrentZone] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Assignment Dialog State
  const [assignmentDialog, setAssignmentDialog] = useState<{
    open: boolean;
    table: any | null;
    booking: Booking | null;
  }>({ open: false, table: null, booking: null });

  // Edit Booking Dialog State
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    booking: Booking | null;
    table: any | null;
  }>({ open: false, booking: null, table: null });

  // Form State for Editing
  const [editForm, setEditForm] = useState({
    guest_name: '',
    guests_count: 0,
    booking_time: '',
    notes: ''
  });


  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const colors = {
    stageBg: isDark ? '#18181b' : '#ffffff',
    tableFill: isDark ? '#27272a' : '#e5e7eb',
    tableStroke: isDark ? '#52525b' : '#9ca3af',
    occupiedFill: isDark ? '#7f1d1d' : '#fecaca', // Red
    occupiedStroke: isDark ? '#ef4444' : '#f87171',
    selectedFill: isDark ? '#1e3a8a' : '#bfdbfe', // Blue
    selectedStroke: isDark ? '#60a5fa' : '#3b82f6',
    text: isDark ? '#e4e4e7' : '#000000',
    occupiedText: isDark ? '#fecaca' : '#7f1d1d',
    // Deco
    wallFill: isDark ? '#3f3f46' : '#71717a',
    wallStroke: isDark ? '#27272a' : '#52525b',
    // Column matches Wall
    columnFill: isDark ? '#3f3f46' : '#71717a',
    columnStroke: isDark ? '#27272a' : '#52525b',
    plantFill: isDark ? '#166534' : '#bbf7d0',
    plantStroke: isDark ? '#14532d' : '#86efac',
    // New
    doorFill: isDark ? '#3f3f46' : '#71717a',
    doorStroke: isDark ? '#27272a' : '#52525b',
    // Counter matches Table
    counterFill: isDark ? '#27272a' : '#e5e7eb',
    counterStroke: isDark ? '#52525b' : '#9ca3af',
    // Booth matches Wall
    boothFill: isDark ? '#3f3f46' : '#71717a',
    boothStroke: isDark ? '#27272a' : '#52525b',
  };

  useEffect(() => {
    const loadFloorPlan = async () => {
      setLoading(true);
      try {
        const data = await getFloorPlan(locationId);
        setZones(data.zones);
        setTables(data.tables);
        if (data.zones.length > 0) {
          setCurrentZone(data.zones[0]);
        }
      } catch (error) {
        console.error(error);
        toast.error('Errore nel caricamento della mappa');
      } finally {
        setLoading(false);
      }
    };
    loadFloorPlan();
  }, [locationId]);

  // Auto-Center Logic (Matches ZoneEditor)
  useEffect(() => {
    if (stageDimensions.width > 0 && currentZone) {
      const w = currentZone.width || 1000;
      const h = currentZone.height || 800;

      // Calculate best fit scale
      const scaleX = (stageDimensions.width - 60) / w;
      const scaleY = (stageDimensions.height - 60) / h;
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 1.2);

      setScale(newScale);

      // Center based on that scale
      const centerX = (stageDimensions.width - w * newScale) / 2;
      const centerY = (stageDimensions.height - h * newScale) / 2;

      setPosition({ x: centerX, y: centerY });
    }
  }, [stageDimensions.width, stageDimensions.height, currentZone]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setStageDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Filter tables for current zone
  const currentTables = tables.filter(t => t.zone_id === currentZone?.id);

  // Group Bookings
  const unassignedBookings = bookings.filter(b => !b.table_id && b.status !== 'cancelled' && b.status !== 'no_show');
  const assignedBookings = bookings.filter(b => b.table_id);

  // Helper to find booking for a table
  const getBookingForTable = (tableId: string) => {
    return assignedBookings.find(b => b.table_id === tableId);
  };

  const handleTableClick = (table: any) => {
    // Ignore non-seatable elements
    if (!table.seats || table.seats <= 0) return;

    const existingBooking = getBookingForTable(table.id);

    if (existingBooking) {
      setEditDialog({ open: true, booking: existingBooking, table });
      setEditForm({
        guest_name: existingBooking.guest_name,
        guests_count: existingBooking.guests_count,
        booking_time: format(new Date(existingBooking.booking_time), 'HH:mm'),
        notes: existingBooking.notes || ''
      });
      return;
    }

    if (selectedBooking) {
      // Check capacity
      if (selectedBooking.guests_count > table.seats) {
        toast.warning(`Attenzione: Il tavolo ha ${table.seats} posti, ma la prenotazione è per ${selectedBooking.guests_count}.`);
        // Show confirmation logic could go here, but for now allow direct assignment via dialog
      }
      setAssignmentDialog({ open: true, table, booking: selectedBooking });
    } else {
      toast.info("Seleziona una prenotazione dalla lista per assegnarla.");
    }
  };

  const confirmAssignment = async () => {
    if (!assignmentDialog.booking || !assignmentDialog.table) return;

    try {
      await assignBookingToTable(assignmentDialog.booking.id, assignmentDialog.table.id);
      toast.success("Tavolo assegnato!");
      if (onAssignmentChange) onAssignmentChange();
      setAssignmentDialog({ open: false, table: null, booking: null });
      setSelectedBooking(null);
    } catch (e) {
      console.error(e);
      toast.error("Errore nell'assegnazione");
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar: Unassigned Bookings */}
      <Card className="w-80 shrink-0  flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Da Assegnare ({unassignedBookings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-4 pt-0">
              {unassignedBookings.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">Nessuna prenotazione da assegnare.</p>
              )}
              {unassignedBookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedBooking?.id === booking.id ? 'bg-zinc-100 dark:bg-zinc-800 border-primary' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm truncate">{booking.guest_name}</span>
                    <Badge variant="outline" className="text-xs">{format(new Date(booking.booking_time), 'HH:mm')}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {booking.guests_count}
                    </div>
                    {booking.notes && <span className="truncate max-w-[120px]">{booking.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Map */}
      <Card className="flex-1 flex flex-col overflow-hidden border-l-0 pt-0 gap-0">
        {zones.length > 1 && (
          <div className="flex border-b overflow-x-auto">
            {zones.map(z => (
              <Button
                key={z.id}
                variant={currentZone?.id === z.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentZone(z)}
              >
                {z.name}
              </Button>
            ))}
          </div>
        )}

        <div ref={containerRef} className="flex-1 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
          {currentZone && (
            <div className="absolute inset-0">
              <Stage
                width={stageDimensions.width}
                height={stageDimensions.height}
                x={position.x}
                y={position.y}
                scaleX={scale}
                scaleY={scale}
                draggable
              >
                <Layer>
                  {/* Room Background */}
                  <Rect
                    width={currentZone.width || 1000}
                    height={currentZone.height || 800}
                    fill={isDark ? '#000000' : '#ffffff'}
                    shadowColor="black"
                    shadowBlur={20}
                    shadowOpacity={0.1}
                  />

                  {currentTables.map(table => {
                    const booking = getBookingForTable(table.id);
                    const isOccupied = !!booking;
                    const isSeatable = table.seats > 0;

                    // Safe defaults for width depending on shape (avoid 0 width rendering issues)
                    const safeWidth = table.width && table.width > 5 ? table.width : 60;
                    const safeHeight = table.height && table.height > 5 ? table.height : 60;

                    return (
                      <Group
                        key={table.id}
                        x={table.position_x}
                        y={table.position_y}
                        rotation={table.rotation}
                        onClick={() => handleTableClick(table)}
                        onTap={() => handleTableClick(table)}
                        listening={true}
                      >
                        {(() => {
                          switch (table.shape) {
                            case 'rect':
                              return (
                                <Rect
                                  width={safeWidth}
                                  height={safeHeight}
                                  fill={isOccupied ? colors.occupiedFill : colors.tableFill}
                                  stroke={isOccupied ? colors.occupiedStroke : colors.tableStroke}
                                  strokeWidth={2}
                                  cornerRadius={4}
                                  offsetX={safeWidth / 2}
                                  offsetY={safeHeight / 2}
                                />
                              );
                            case 'door':
                              return (
                                <Group>
                                  <Rect
                                    width={safeWidth / 3} height={safeHeight}
                                    fill={colors.doorFill}
                                    stroke={colors.doorStroke}
                                    strokeWidth={1}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                  />
                                  <Rect
                                    x={(safeWidth * 2) / 3}
                                    width={safeWidth / 3} height={safeHeight}
                                    fill={colors.doorFill}
                                    stroke={colors.doorStroke}
                                    strokeWidth={1}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                  />
                                </Group>
                              );
                            case 'counter':
                              return (
                                <Rect
                                  width={safeWidth}
                                  height={safeHeight}
                                  fill={colors.counterFill}
                                  stroke={colors.counterStroke}
                                  strokeWidth={1}
                                  cornerRadius={2}
                                  offsetX={safeWidth / 2}
                                  offsetY={safeHeight / 2}
                                />
                              );
                            case 'booth':
                              return (
                                <Rect
                                  width={safeWidth}
                                  height={safeHeight}
                                  fill={colors.boothFill}
                                  stroke={colors.boothStroke}
                                  strokeWidth={1}
                                  cornerRadius={2}
                                  offsetX={safeWidth / 2}
                                  offsetY={safeHeight / 2}
                                />
                              );

                            case 'wall':
                              return (
                                <Rect
                                  width={safeWidth}
                                  height={safeHeight}
                                  fill={colors.wallFill}
                                  stroke={colors.wallStroke}
                                  strokeWidth={1}
                                  cornerRadius={2}
                                  offsetX={safeWidth / 2}
                                  offsetY={safeHeight / 2}
                                />
                              );
                            case 'column':
                              // Handle both rect and round columns
                              if (table.radius) {
                                return (
                                  <Circle
                                    radius={table.radius}
                                    fill={colors.columnFill}
                                    stroke={colors.columnStroke}
                                    strokeWidth={1}
                                  />
                                )
                              } else {
                                return (
                                  <Rect
                                    width={safeWidth}
                                    height={safeHeight}
                                    fill={colors.columnFill}
                                    stroke={colors.columnStroke}
                                    strokeWidth={1}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                  />
                                );
                              }

                            case 'plant':
                              return (
                                <Group>
                                  <Circle
                                    radius={safeWidth / 2}
                                    fill={colors.plantFill}
                                    stroke={colors.plantStroke}
                                    strokeWidth={1}
                                    opacity={0.8}
                                  />
                                  <Circle radius={(safeWidth / 2) * 0.4} fill={colors.plantStroke} opacity={0.5} />
                                </Group>
                              );

                            case 'circle':
                            default:
                              return (
                                <Circle
                                  radius={safeWidth / 2}
                                  fill={isOccupied ? colors.occupiedFill : colors.tableFill}
                                  stroke={isOccupied ? colors.occupiedStroke : colors.tableStroke}
                                  strokeWidth={2}
                                />
                              );
                          }
                        })()}

                        {/* Labels only for seatable tables */}
                        {isSeatable && (
                          <>
                            <Text
                              text={booking ? booking.guest_name : table.table_number.toString()}
                              width={safeWidth}
                              height={safeHeight}
                              offsetX={safeWidth / 2}
                              offsetY={safeHeight / 2}
                              align="center"
                              verticalAlign="middle"
                              fontSize={10}
                              fill={isOccupied ? colors.occupiedText : colors.text}
                              wrap="char"
                              pointerEvents="none"
                            />
                            {isOccupied && (
                              <Text
                                text={format(new Date(booking.booking_time), 'HH:mm')}
                                width={safeWidth}
                                y={10}
                                offsetX={safeWidth / 2}
                                align="center"
                                fontSize={8}
                                fill={colors.occupiedText}
                                pointerEvents="none"
                              />
                            )}
                          </>
                        )}
                      </Group>
                    )
                  })}
                </Layer>
              </Stage>
            </div>
          )}
          {!currentZone && !loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Nessuna mappa trovata.
            </div>
          )}
        </div>
      </Card >

      <Dialog open={assignmentDialog.open} onOpenChange={(val) => !val && setAssignmentDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assegna Prenotazione</DialogTitle>
            <DialogDescription>
              Stai assegnando <strong>{assignmentDialog.booking?.guest_name}</strong> ({assignmentDialog.booking?.guests_count} persone)
              al Tavolo <strong>{assignmentDialog.table?.table_number}</strong> ({assignmentDialog.table?.seats} posti).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialog({ open: false, table: null, booking: null })}>Annulla</Button>
            <Button onClick={confirmAssignment}>Conferma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(val) => !val && setEditDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Prenotazione</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della prenotazione al Tavolo {editDialog.table?.table_number}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.guest_name}
                onChange={(e) => setEditForm({ ...editForm, guest_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-guests" className="text-right">Ospiti</Label>
              <Input
                id="edit-guests"
                type="number"
                value={editForm.guests_count}
                onChange={(e) => setEditForm({ ...editForm, guests_count: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-notes" className="text-right">Note</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="destructive"
              onClick={async () => {
                if (!editDialog.booking) return;
                try {
                  await unassignBooking(editDialog.booking.id);
                  toast.success("Tavolo liberato!");
                  setEditDialog({ open: false, booking: null, table: null });
                } catch (e) {
                  toast.error("Errore nel liberare il tavolo");
                }
              }}
            >
              Libera Tavolo
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialog({ open: false, booking: null, table: null })}>Annulla</Button>
              <Button onClick={async () => {
                if (!editDialog.booking) return;
                try {
                  await updateBooking(editDialog.booking.id, {
                    guest_name: editForm.guest_name,
                    guests_count: editForm.guests_count,
                    notes: editForm.notes
                  });
                  toast.success("Prenotazione aggiornata!");
                  setEditDialog({ open: false, booking: null, table: null });
                } catch (e) {
                  toast.error("Errore nell'aggiornamento");
                }
              }}>Salva Modifiche</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
