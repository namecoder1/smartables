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
import { Users, Clock, ZoomIn, ZoomOut, Printer, ScrollText, Menu } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveDialog } from '@/components/utility/responsive-dialog';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiEdit3 } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { assignBookingToTable, updateBooking, unassignBooking } from '@/app/actions/bookings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableOrdersPanel } from "./table-orders-panel";
import { NumberInput } from '../ui/number-input';
import { cn } from '@/lib/utils';


interface ReservationsFloorPlanProps {
  locationId: string;
  selectedDate: Date;
  bookings: Booking[];
  onAssignmentChange?: () => void;
  onTableSelect?: (table: any, booking: Booking | undefined, hasActiveOrder: boolean) => void;
  variant: 'reservations' | 'orders'
}

export default function ReservationsFloorPlan({
  locationId,
  selectedDate,
  bookings,
  onAssignmentChange,
  onTableSelect,
  variant
}: ReservationsFloorPlanProps) {
  const { theme, systemTheme } = useTheme();
  const [zones, setZones] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [currentZone, setCurrentZone] = useState<any>(null);
  const [locationSlug, setLocationSlug] = useState<string>(""); // Added state
  const [showAssignCard, setShowAssignCard] = useState<boolean>(false);
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
    refreshTrigger?: number;
  }>({ open: false, booking: null, table: null, activeTab: 'booking', refreshTrigger: 0 });

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
    paperBg: isDark ? '#18181b' : '#ffffff',
    tableFill: isDark ? '#27272a' : '#e5e7eb',
    tableStroke: isDark ? '#52525b' : '#9ca3af',
    // Status colors
    bookedFill: isDark ? '#1e3a5a' : '#dbeafe',
    bookedStroke: isDark ? '#3b82f6' : '#2563eb',
    occupiedFill: isDark ? '#431407' : '#ffedd5',
    occupiedStroke: isDark ? '#ea580c' : '#ea580c',
    freeFill: isDark ? '#14532d' : '#dcfce7',
    freeStroke: isDark ? '#22c55e' : '#16a34a',
    text: isDark ? '#e4e4e7' : '#000000',
    // Deco
    wallFill: isDark ? '#3f3f46' : '#71717a',
    wallStroke: isDark ? '#27272a' : '#52525b',
    columnFill: isDark ? '#3f3f46' : '#71717a',
    columnStroke: isDark ? '#27272a' : '#52525b',
    plantFill: isDark ? '#166534' : '#bbf7d0',
    plantStroke: isDark ? '#14532d' : '#86efac',
    doorFill: isDark ? '#3f3f46' : '#71717a',
    doorStroke: isDark ? '#27272a' : '#52525b',
    counterFill: isDark ? '#27272a' : '#e5e7eb',
    counterStroke: isDark ? '#52525b' : '#9ca3af',
    boothFill: isDark ? '#3f3f46' : '#71717a',
    boothStroke: isDark ? '#27272a' : '#52525b',
    cashierFill: isDark ? '#7c2d12' : '#fdba74',
    cashierStroke: isDark ? '#c2410c' : '#f97316',
    containerFill: isDark ? 'transparent' : 'transparent',
    containerStroke: isDark ? '#52525b' : '#9ca3af',
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
    const isSeatable = table.seats > 0 && ['rect', 'circle', 'counter'].includes(table.shape);
    if (!isSeatable) return;

    const existingBooking = getBookingForTable(table.id);
    const hasActiveOrder = activeOrderTableIds.has(table.id);

    if (onTableSelect) {
      onTableSelect(table, existingBooking, hasActiveOrder);
      return;
    }

    if (existingBooking || hasActiveOrder) {
      setEditDialog({
        open: true,
        booking: existingBooking || null,
        table,
        activeTab: existingBooking ? 'booking' : 'orders',
        refreshTrigger: Date.now()
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
    <div className={cn("flex  relative", variant === 'reservations' ? 'h-[calc(100vh-315px)]' : 'h-[calc(100vh-250px)]')}>
      {/* Sidebar: Unassigned Bookings */}
      {!onTableSelect && (
        <Card className={cn(variant === 'reservations' ? 'rounded-t-none bg-[#ffffff]' : '', "w-80 gap-2 py-4 shrink-0 rounded-r-none flex-col", showAssignCard ? "flex absolute top-0 left-0 z-10 h-full" : "hidden xl:flex ")}>
          <CardHeader className='border-b-2 pb-2! mb-2'>
            <CardTitle className="text-lg tracking-tight">Da Assegnare ({unassignedBookings.length})</CardTitle>
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
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedBooking?.id === booking.id ? 'bg-primary/5 border-primary/30' : 'hover:bg-zinc-50 bg-input/30'}`}
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
                      {booking.notes && <span className="truncate max-w-30">{booking.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Main Map */}
      <Card className={cn("flex-1 flex flex-col overflow-hidden py-0 gap-0", variant === 'reservations' ? 'rounded-t-none' : '', !onTableSelect ? "xl:border-l-0 xl:rounded-l-none" : "")}>
        {zones.length > 1 && (
          <div className="flex border-b-2 bg-[#ffffff] overflow-x-auto">
            {zones.map(z => (
              <Button
                key={z.id}
                variant={currentZone?.id === z.id ? 'default' : 'ghost'}
                size="sm"
                className='rounded-none'
                onClick={() => setCurrentZone(z)}
              >
                {z.name}
              </Button>
            ))}
          </div>
        )}

        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          {!onTableSelect && (
            <div className="absolute top-4 right-4 flex xl:hidden gap-2 z-10">
              <Button variant="outline" onClick={() => setShowAssignCard(!showAssignCard)} size="icon" className="bg-white/90 backdrop-blur shadow-sm">
                <Menu />
              </Button>
            </div>
          )}
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
                    fill='#ffffff'
                    shadowColor="gray"
                    shadowBlur={2}
                  />

                  {currentTables.map(table => {
                    const booking = getBookingForTable(table.id);
                    const hasActiveOrder = activeOrderTableIds.has(table.id);
                    const isSeatable = table.seats > 0 && ['rect', 'circle', 'counter'].includes(table.shape);

                    // Status: booked (has booking, not arrived), occupied (arrived/walk-in), free
                    const isBooked = !!booking && booking.status !== 'arrived' && booking.status !== 'no_show' && booking.status !== 'cancelled';
                    const isOccupied = (!!booking && booking.status === 'arrived') || hasActiveOrder;
                    const isFree = isSeatable && !isBooked && !isOccupied;

                    // Pick colors based on status
                    const statusFill = isOccupied ? colors.occupiedFill : isBooked ? colors.bookedFill : isFree ? colors.freeFill : colors.tableFill;
                    const statusStroke = isOccupied ? colors.occupiedStroke : isBooked ? colors.bookedStroke : isFree ? colors.freeStroke : colors.tableStroke;
                    const badgeColor = isOccupied ? '#ea580c' : isBooked ? '#2563eb' : '#22c55e';

                    // Safe defaults for width depending on shape (avoid 0 width rendering issues)
                    const safeWidth = table.width && table.width > 5 ? table.width : 60;
                    const safeHeight = table.height && table.height > 5 ? table.height : 60;

                    const renderChairs = () => {
                      if (!table.seats || table.seats <= 0) return null;
                      if (table.shape !== 'rect' && table.shape !== 'circle' && table.shape !== 'counter') return null;

                      const chairRadius = 10;
                      const chairs = [];
                      const offset = chairRadius - 1;

                      const drawLineOfChairs = (count: number, side: 'top' | 'bottom' | 'left' | 'right') => {
                        if (count === 0) return [];
                        const lineChairs = [];
                        for (let i = 0; i < count; i++) {
                          let cx = 0, cy = 0, rot = 0;
                          if (side === 'top' || side === 'bottom') {
                            const spacing = safeWidth / (count + 1);
                            cx = -safeWidth / 2 + spacing * (i + 1);
                            cy = side === 'top' ? -safeHeight / 2 - offset : safeHeight / 2 + offset;
                            rot = side === 'top' ? 180 : 0;
                          } else {
                            const spacing = safeHeight / (count + 1);
                            cy = -safeHeight / 2 + spacing * (i + 1);
                            cx = side === 'left' ? -safeWidth / 2 - offset : safeWidth / 2 + offset;
                            rot = side === 'left' ? 270 : 90;
                          }
                          lineChairs.push(
                            <Arc
                              key={`c-${table.id}-${side}-${i}`}
                              x={cx} y={cy}
                              innerRadius={0}
                              outerRadius={chairRadius}
                              angle={180}
                              rotation={rot}
                              fill={colors.paperBg}
                              stroke={statusStroke}
                              strokeWidth={1}
                              listening={false}
                              perfectDrawEnabled={false}
                            />
                          );
                        }
                        return lineChairs;
                      };

                      if (table.shape === 'circle') {
                        const tableRadius = table.radius || safeWidth / 2;
                        const distance = tableRadius + offset;
                        for (let i = 0; i < table.seats; i++) {
                          const angle = (i * 2 * Math.PI) / table.seats;
                          chairs.push(
                            <Arc
                              key={`c-${table.id}-${i}`}
                              x={distance * Math.cos(angle)}
                              y={distance * Math.sin(angle)}
                              innerRadius={0}
                              outerRadius={chairRadius}
                              angle={180}
                              rotation={(angle * 180) / Math.PI + 90}
                              fill={colors.paperBg}
                              stroke={statusStroke}
                              strokeWidth={1}
                              listening={false}
                              perfectDrawEnabled={false}
                            />
                          );
                        }
                      } else if (table.shape === 'rect') {
                        const w = safeWidth;
                        const h = safeHeight;
                        let topSeats = 0, bottomSeats = 0, leftSeats = 0, rightSeats = 0;
                        let remaining = table.seats;
                        if (w >= h) {
                          topSeats = Math.ceil(remaining / 2);
                          bottomSeats = remaining - topSeats;
                          if (table.seats >= 6 && remaining >= 4) {
                            leftSeats = 1; rightSeats = 1;
                            remaining -= 2;
                            topSeats = Math.ceil(remaining / 2);
                            bottomSeats = remaining - topSeats;
                          }
                        } else {
                          leftSeats = Math.ceil(remaining / 2);
                          rightSeats = remaining - leftSeats;
                          if (table.seats >= 6 && remaining >= 4) {
                            topSeats = 1; bottomSeats = 1;
                            remaining -= 2;
                            leftSeats = Math.ceil(remaining / 2);
                            rightSeats = remaining - leftSeats;
                          }
                        }
                        chairs.push(...drawLineOfChairs(topSeats, 'top'));
                        chairs.push(...drawLineOfChairs(bottomSeats, 'bottom'));
                        chairs.push(...drawLineOfChairs(leftSeats, 'left'));
                        chairs.push(...drawLineOfChairs(rightSeats, 'right'));
                      } else if (table.shape === 'counter') {
                        // For counter, just draw chairs on one side (usually bottom or top based on width/height ratio)
                        const w = safeWidth;
                        const h = safeHeight;
                        if (w >= h) {
                          chairs.push(...drawLineOfChairs(table.seats, 'bottom'));
                        } else {
                          chairs.push(...drawLineOfChairs(table.seats, 'right'));
                        }
                      }
                      return <Group listening={false}>{chairs}</Group>;
                    };

                    const renderTableBadges = () => {
                      if (!isSeatable) return null;
                      const isCircle = table.shape === 'circle';
                      const w = isCircle ? (table.radius || safeWidth / 2) * 2 : safeWidth;
                      const h = isCircle ? (table.radius || safeWidth / 2) * 2 : safeHeight;

                      const shortLabel = String(table.table_number || '?').toString().replace(/\D/g, '') || String(table.table_number || '?').substring(0, 2);
                      const labelW = Math.max(shortLabel.length * 8 + 8, 20);
                      const totalBadgesW = labelW + 4 + 28;
                      const startX = -totalBadgesW / 2;
                      const badgeY = isCircle ? -(table.radius || safeWidth / 2) - 4 : -h / 2 + 4;

                      return (
                        <Group listening={false} perfectDrawEnabled={false}>
                          <Rect
                            x={startX} y={badgeY}
                            width={labelW} height={16}
                            fill={badgeColor}
                            cornerRadius={8}
                          />
                          <Text
                            text={shortLabel}
                            x={startX} y={badgeY}
                            width={labelW} height={16}
                            fill="white"
                            fontSize={10}
                            fontStyle="bold"
                            align="center"
                            verticalAlign="middle"
                            listening={false}
                            perfectDrawEnabled={false}
                          />
                          <Rect
                            x={startX + labelW + 4} y={badgeY}
                            width={28} height={16}
                            fill="white"
                            stroke={badgeColor}
                            strokeWidth={1}
                            cornerRadius={8}
                          />
                          <Text
                            text={String(table.seats || 0)}
                            x={startX + labelW + 4} y={badgeY}
                            width={28} height={16}
                            fill="#64748b"
                            fontSize={9}
                            fontStyle="bold"
                            align="center"
                            verticalAlign="middle"
                            listening={false}
                            perfectDrawEnabled={false}
                          />
                        </Group>
                      );
                    };

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
                        {renderChairs()}
                        {(() => {
                          switch (table.shape) {
                            case 'rect':
                              return (
                                <Rect
                                  width={safeWidth}
                                  height={safeHeight}
                                  fill={isSeatable ? statusFill : colors.tableFill}
                                  stroke={isSeatable ? statusStroke : colors.tableStroke}
                                  strokeWidth={2}
                                  cornerRadius={4}
                                  offsetX={safeWidth / 2}
                                  offsetY={safeHeight / 2}
                                />
                              );
                            case 'door': {
                              const isBottomHalf = table.position_y > (currentZone?.height || 800) / 2;
                              const doorWidth = safeWidth * 0.75;
                              const pivotX = -doorWidth / 3;
                              const pivotY = isBottomHalf ? -safeHeight / 2 : safeHeight / 2;
                              const arcRotation = isBottomHalf ? -90 : 0;
                              const leafRotation = isBottomHalf ? -90 : 90;

                              return (
                                <Group offsetX={safeWidth / 2} offsetY={safeHeight / 2}>
                                  {/* Door swing arc */}
                                  <Arc
                                    x={pivotX}
                                    y={pivotY}
                                    innerRadius={doorWidth}
                                    outerRadius={doorWidth}
                                    angle={90}
                                    rotation={arcRotation}
                                    stroke={colors.doorStroke}
                                    strokeWidth={0.8}
                                    dash={[3, 3]}
                                    opacity={0.5}
                                  />
                                  {/* Door leaf */}
                                  <Rect
                                    x={pivotX}
                                    y={pivotY}
                                    width={doorWidth}
                                    height={1.5}
                                    fill={colors.doorFill}
                                    stroke={colors.doorStroke}
                                    strokeWidth={0.5}
                                    rotation={leafRotation}
                                    offsetY={0.75}
                                  />
                                </Group>
                              );
                            }
                            case 'counter':
                              return (
                                <Rect
                                  width={safeWidth}
                                  height={safeHeight}
                                  fill={isSeatable ? statusFill : colors.counterFill}
                                  stroke={isSeatable ? statusStroke : colors.counterStroke}
                                  strokeWidth={isSeatable ? 2 : 1}
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

                            case 'chair':
                              return (
                                <Arc
                                  innerRadius={0}
                                  outerRadius={8}
                                  angle={180}
                                  rotation={180}
                                  fill={colors.paperBg}
                                  stroke={colors.tableStroke}
                                  strokeWidth={1}
                                />
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
                                    text="Cassa"
                                    fontSize={Math.min(safeWidth, safeHeight) * 0.2}
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
                                    fill={isDark ? '#27272a' : '#e4e4e7'}
                                    stroke={isDark ? '#3f3f46' : '#a1a1aa'}
                                    strokeWidth={1}
                                    cornerRadius={4}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                  />
                                  <Text
                                    text="Bagni"
                                    fontSize={Math.min(safeWidth, safeHeight) * 0.2}
                                    fill={isDark ? '#a1a1aa' : '#3f3f46'}
                                    align="center"
                                    verticalAlign="middle"
                                    width={safeWidth}
                                    height={safeHeight}
                                    offsetX={safeWidth / 2}
                                    offsetY={safeHeight / 2}
                                    listening={false}
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
                                  fill={isSeatable ? statusFill : colors.tableFill}
                                  stroke={isSeatable ? statusStroke : colors.tableStroke}
                                  strokeWidth={2}
                                />
                              );
                          }
                        })()}

                        {/* Badges counter-rotated to stay upright */}
                        <Group rotation={-(table.rotation || 0)}>
                          {renderTableBadges()}
                        </Group>

                        {isSeatable && isOccupied && (
                          <>
                            <Text
                              text={booking ? booking.guest_name : 'Occupato'}
                              width={safeWidth}
                              height={safeHeight}
                              offsetX={!table.radius ? safeWidth / 2 : table.radius}
                              offsetY={!table.radius ? safeHeight / 2 : table.radius}
                              align="center"
                              verticalAlign="middle"
                              fontSize={10}
                              fill={isDark ? '#fecaca' : '#7f1d1d'}
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
                                fill={isDark ? '#fecaca' : '#7f1d1d'}
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
                            fill={isDark ? '#a1a1aa' : '#6b7280'}
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
          <div className={cn('absolute top-4 flex bg-white border rounded-lg shadow-sm items-center z-10', variant === 'reservations' ? 'right-16 xl:right-4' : 'right-4')}>
            <Button variant="ghost" size="icon" className='rounded-r-none border-r opacity-80 hover:opacity-100' onClick={() => setScale(s => Math.max(0.1, s - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <span className="text-xs w-12 text-center text-muted-foreground">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className='rounded-l-none border-l opacity-80 hover:opacity-100' onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
          </div>

          <div className='absolute bottom-0 right-0 px-2 pb-1.5 pr-2.5 py-1 bg-border/40 backdrop-blur-sm hover:bg-primary/30 border-t border-l rounded-tl-lg group hover:border-primary transition-colors'>
            <Link href={`/areas-management/${currentZone?.id}`} className='text-sm flex items-center gap-2'>
              <FiEdit3 />
              Modifica mappa
            </Link>
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


      <ResponsiveDialog
        isOpen={editDialog.open}
        setIsOpen={(val: boolean) => !val && setEditDialog(prev => ({ ...prev, open: false }))}
        title={`Tavolo ${editDialog.table?.table_number}`}
        description="Gestisci la prenotazione e gli ordini per questo tavolo."
      >

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
                refreshTrigger={editDialog.refreshTrigger || 0}
                guestCount={editForm.guests_count}
              />
            )}
          </TabsContent>
        </Tabs>
      </ResponsiveDialog>
    </div >
  );
}

