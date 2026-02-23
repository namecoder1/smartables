'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text, Arc } from 'react-konva';
import { useTheme } from 'next-themes';
import { getFloorPlan } from '@/app/actions/floor-plan';
import { toast } from 'sonner';
import { Booking } from '@/types/general';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Users, Clock, ZoomIn, ZoomOut, Printer, ScrollText } from 'lucide-react';
import Link from 'next/link';

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
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableOrdersPanel } from "./table-orders-panel";
import { QRCodeSVG } from 'qrcode.react';
import { NumberInput } from '../ui/number-input';


interface ReservationsFloorPlanProps {
  locationId: string;
  selectedDate: Date;
  bookings: Booking[];
  onAssignmentChange?: () => void;
}

export default function ReservationsFloorPlan({ locationId, selectedDate, bookings, onAssignmentChange }: ReservationsFloorPlanProps) {
  const { theme, systemTheme } = useTheme();
  const [zones, setZones] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [currentZone, setCurrentZone] = useState<any>(null);
  const [locationSlug, setLocationSlug] = useState<string>(""); // Added state
  // ...

  const [activeOrderTableIds, setActiveOrderTableIds] = useState<Set<string>>(new Set());
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
    activeTab?: string;
  }>({ open: false, booking: null, table: null, activeTab: 'booking' });

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
    // New
    cashierFill: isDark ? '#7c2d12' : '#fdba74', // Orange-900 / Orange-300
    cashierStroke: isDark ? '#c2410c' : '#f97316', // Orange-700 / Orange-500
    restroomFill: isDark ? '#1e3a8a' : '#bfdbfe', // Blue-900 / Blue-200
    restroomStroke: isDark ? '#1d4ed8' : '#3b82f6', // Blue-700 / Blue-500
    containerFill: isDark ? 'transparent' : 'transparent',
    containerStroke: isDark ? '#52525b' : '#9ca3af',
    containerText: isDark ? '#a1a1aa' : '#6b7280',
  };

  const loadFloorPlan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFloorPlan(locationId);
      setZones(data.zones);
      setTables(data.tables);

      if (!currentZone && data.zones.length > 0) {
        setCurrentZone(data.zones[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Errore nel caricamento della mappa');
    } finally {
      setLoading(false);
    }
  }, [locationId, currentZone]);

  useEffect(() => {
    loadFloorPlan();
  }, [loadFloorPlan]);

  useEffect(() => {
    const fetchActiveOrders = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('orders')
        .select('table_id')
        .eq('location_id', locationId)
        .in('status', ['pending', 'preparing', 'ready', 'served'])
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (data) {
        const ids = new Set(data.filter(o => o.table_id).map(o => o.table_id));
        setActiveOrderTableIds(ids);
      }
    };
    if (locationId) fetchActiveOrders();

    const setupRealtime = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const channel = supabase.channel('orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `location_id=eq.${locationId}` }, () => {
          fetchActiveOrders();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    setupRealtime();

  }, [locationId, selectedDate]);

  // Fetch Location Slug separately
  useEffect(() => {
    const fetchSlug = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('locations').select('slug').eq('id', locationId).single();
      if (data) setLocationSlug(data.slug);
    };
    if (locationId) fetchSlug();
  }, [locationId]);


  useRealtimeRefresh('bookings', {
    filter: locationId ? `location_id=eq.${locationId}` : undefined,
    onUpdate: onAssignmentChange
  })

  useRealtimeRefresh('zones', {
    filter: locationId ? `location_id=eq.${locationId}` : undefined,
    onUpdate: () => {
      // Re-fetch zones/tables but keep current booking data (handled by parent or separate refresh)
      // Actually we need to re-run the effect that loads floor plan
      // We can duplicate the fetch logic or extract it. 
      // Let's just trigger a re-render by toggling a key? No, just call the effect again.
      // But useEffect has dependencies.
      // Let's extract the fetch function.
      // For now, I will just replicate the fetch logic in a useCallback or separate function.
      // Or better, let's look at lines 104-120. It's inside useEffect.
    }
  })

  // NOTE: The above approach to re-fetch inside useEffect is tricky without extraction.
  // I will refactor the fetch logic in the next step to be usable by onUpdate.


  // -- Panning Logic --
  const isPanning = useRef(false);
  const lastPointerPosition = useRef<{ x: number, y: number } | null>(null);

  const handleStageMouseDown = (e: any) => {
    const stage = e.target.getStage();
    // Only pan if clicking on empty stage (not on draggable items, though items are not draggable here usually)
    // Actually, items might have onClick.
    // Let's allow panning if clicking on background or empty space.
    // In Konva, if we click on a shape with listening=true, it catches the event.
    // If we want to pan, we usually drag the background.
    // But here we are using draggable on Stage? 
    // Wait, the Stage in the previous code had `draggable` prop on line 307.
    // If Stage is draggable, Konva handles panning automatically for the whole stage!
    // BUT, we want controlled panning/zooming like in ZoneEditor to keep track of position state.
    // ZoneEditor uses manual panning logic. Let's stick to that for consistency and state control.

    // Check if we clicked a table
    const clickedOnTable = e.target.getParent()?.className === 'Group';
    if (clickedOnTable) return;

    isPanning.current = true;
    lastPointerPosition.current = stage.getPointerPosition();
  };

  const handleStageMouseMove = (e: any) => {
    if (!isPanning.current) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (pos && lastPointerPosition.current) {
      const dx = pos.x - lastPointerPosition.current.x;
      const dy = pos.y - lastPointerPosition.current.y;

      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPointerPosition.current = pos;
    }
  };

  const handleStageMouseUp = () => {
    isPanning.current = false;
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = scale;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 3)); // Limits matching ZoneEditor roughly

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setScale(newScale);
    setPosition(newPos);
  };

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
    const hasActiveOrder = activeOrderTableIds.has(table.id);

    if (existingBooking || hasActiveOrder) {
      setEditDialog({
        open: true,
        booking: existingBooking || null,
        table,
        activeTab: existingBooking ? 'booking' : 'orders'
      });

      if (existingBooking) {
        setEditForm({
          guest_name: existingBooking.guest_name,
          guests_count: existingBooking.guests_count,
          booking_time: format(new Date(existingBooking.booking_time), 'HH:mm'),
          notes: existingBooking.notes || ''
        });
      }
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
    <div className="flex h-[calc(100vh-220px)]">
      {/* Sidebar: Unassigned Bookings */}
      <Card className="w-80 shrink-0 rounded-r-none flex flex-col">
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
      <Card className="flex-1 flex flex-col overflow-hidden border-l-0 rounded-l-none pt-0 gap-0">
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

        <div ref={containerRef} className="flex-1 bg-card relative overflow-hidden">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {locationSlug && (
              <Link href={`/reservations/print-qr/${locationSlug}`} target="_blank">
                <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur shadow-sm">
                  <Printer className="w-4 h-4 mr-2" /> Stampa QR
                </Button>
              </Link>
            )}
          </div>
          {currentZone && (
            <div className="absolute inset-0">
              <Stage
                width={stageDimensions.width}
                height={stageDimensions.height}
                x={position.x}
                y={position.y}
                scaleX={scale}
                scaleY={scale}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onMouseLeave={handleStageMouseUp}
                onWheel={handleWheel}
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
                    const hasActiveOrder = activeOrderTableIds.has(table.id);
                    const isOccupied = !!booking || hasActiveOrder;
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

                            case 'cashier':
                              return (
                                <Group>
                                  <Rect
                                    width={safeWidth}
                                    height={safeHeight}
                                    fill={colors.cashierFill}
                                    stroke={colors.cashierStroke}
                                    strokeWidth={1}
                                    cornerRadius={4}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                  />
                                  <Text
                                    text="$"
                                    fontSize={Math.min(safeWidth, safeHeight) * 0.6}
                                    fill={colors.text}
                                    align="center"
                                    verticalAlign="middle"
                                    width={safeWidth}
                                    height={safeHeight}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                    pointerEvents="none"
                                  />
                                </Group>
                              );
                            case 'restroom':
                              return (
                                <Group>
                                  <Rect
                                    width={safeWidth}
                                    height={safeHeight}
                                    fill={colors.restroomFill}
                                    stroke={colors.restroomStroke}
                                    strokeWidth={1}
                                    cornerRadius={4}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                  />
                                  <Text
                                    text="WC"
                                    fontSize={Math.min(safeWidth, safeHeight) * 0.4}
                                    fill={colors.text}
                                    align="center"
                                    verticalAlign="middle"
                                    width={safeWidth}
                                    height={safeHeight}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                    pointerEvents="none"
                                  />
                                </Group>
                              );

                            case 'container':
                              return (
                                <Rect
                                  width={safeWidth}
                                  height={safeHeight}
                                  fill={colors.containerFill}
                                  stroke={colors.containerStroke}
                                  strokeWidth={1.5}
                                  dash={[10, 5]}
                                  cornerRadius={4}
                                  offsetX={safeWidth / 2}
                                  offsetY={safeHeight / 2}
                                />
                              );

                            case 'curved-wall':
                              const cRadius = safeWidth; // the radius of the arc
                              return (
                                <Arc
                                  innerRadius={cRadius - (table.radius || 10) / 2}
                                  outerRadius={cRadius + (table.radius || 10) / 2}
                                  angle={safeHeight || 90}
                                  fill={colors.wallFill}
                                  stroke={colors.wallStroke}
                                  strokeWidth={1}
                                />
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

                        {/* Labels only for seatable tables OR specific decorative elements */}
                        {isSeatable && (
                          <>
                            <Text
                              text={booking ? booking.guest_name : (hasActiveOrder ? 'Occupato' : table.table_number.toString())}
                              width={safeWidth}
                              height={safeHeight}
                              offsetX={!table.radius ? safeWidth / 2 : table.radius}
                              offsetY={!table.radius ? safeHeight / 2 : table.radius}
                              align="center"
                              verticalAlign="middle"
                              fontSize={10}
                              fill={isOccupied ? colors.occupiedText : colors.text}
                              wrap="char"
                              pointerEvents="none"
                            />
                            {booking && (
                              <Text
                                text={format(new Date(booking.booking_time), 'HH:mm')}
                                width={safeWidth}
                                y={10}
                                offsetX={!table.radius ? safeWidth / 2 : table.radius}
                                align="center"
                                fontSize={8}
                                fill={colors.occupiedText}
                                pointerEvents="none"
                              />
                            )}
                          </>
                        )}
                        {!isSeatable && table.shape === 'container' && (
                          <Text
                            text={table.table_number.toString() || table.label || "Area"}
                            width={safeWidth}
                            height={safeHeight}
                            offsetX={safeWidth / 2}
                            offsetY={safeHeight / 2}
                            align="center"
                            verticalAlign="middle"
                            fontSize={14}
                            fontStyle="bold"
                            fill={colors.containerText}
                            pointerEvents="none"
                          />
                        )}
                        {hasActiveOrder && (
                          <Circle
                            x={safeWidth / 2}
                            y={-safeHeight / 2}
                            radius={6}
                            fill="#ef4444"
                            stroke="white"
                            strokeWidth={2}
                            shadowColor="black"
                            shadowBlur={2}
                            shadowOpacity={0.3}
                          />
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

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex bg-white dark:bg-zinc-800 border rounded-lg shadow-lg items-center z-10">
            <Button variant="ghost" size="icon" className='rounded-r-none border-r opacity-80 hover:opacity-100' onClick={() => setScale(s => Math.max(0.1, s - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <span className="text-xs w-12 text-center text-muted-foreground">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className='rounded-l-none border-l opacity-80 hover:opacity-100' onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
          </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tavolo {editDialog.table?.table_number}</DialogTitle>
            <DialogDescription>
              Gestisci la prenotazione e gli ordini per questo tavolo.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={editDialog.activeTab || 'booking'}
            onValueChange={(val) => setEditDialog(prev => ({ ...prev, activeTab: val }))}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 border">
              <TabsTrigger value="booking">Prenotazione</TabsTrigger>
              <TabsTrigger value="orders">Ordini</TabsTrigger>
            </TabsList>

            <TabsContent value="booking" className="space-y-4 ">
              {editDialog.booking ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="edit-name" className="text-right">Nome</Label>
                      <Input
                        id="edit-name"
                        value={editForm.guest_name}
                        onChange={(e) => setEditForm({ ...editForm, guest_name: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="edit-guests" className="text-right">Ospiti</Label>
                      <NumberInput
                        value={editForm.guests_count}
                        onValueChange={(val) => setEditForm({ ...editForm, guests_count: val || 0 })}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="edit-notes" className="text-right">Note</Label>
                    <Textarea
                      id="edit-notes"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-xl border-2 border-dashed">
                  <ScrollText className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nessuna prenotazione attiva</p>
                  <p className="text-sm text-muted-foreground">Il tavolo è occupato da un ordine diretto (QR Code o manuale senza prenotazione).</p>
                </div>
              )}

              <DialogFooter className="sm:justify-between mt-4">
                {editDialog.booking ? (
                  <>
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
                      Libera
                    </Button>
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
                    }}>
                      Aggiorna
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setEditDialog({ open: false, booking: null, table: null })}>Chiudi</Button>
                )}
              </DialogFooter>
            </TabsContent>

            <TabsContent value="orders">
              {editDialog.table && (
                <TableOrdersPanel
                  tableId={editDialog.table.id}
                  tableName={editDialog.table.table_number}
                  locationId={locationId}
                  refreshTrigger={Date.now()}
                  guestCount={editForm.guests_count}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog >
    </div >
  );
}

