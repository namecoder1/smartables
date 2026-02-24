"use client";

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Printer } from 'lucide-react';
import { useParams } from 'next/navigation';
import { isDev } from '@/lib/utils';

export default function PrintQrPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const params = useParams();
  const locationSlug = params?.locationSlug as string;

  useEffect(() => {
    if (!locationSlug) return;

    const fetchTables = async () => {
      // 1. Get Location ID
      const { data: location } = await supabase
        .from('locations')
        .select('id, name')
        .eq('slug', locationSlug)
        .single();

      if (!location) return;

      // 2. Get Zones
      const { data: zones } = await supabase
        .from('restaurant_zones')
        .select('id')
        .eq('location_id', location.id);

      if (!zones || zones.length === 0) {
        setLoading(false);
        return;
      }

      const zoneIds = zones.map(z => z.id);

      // 3. Get Tables
      const { data: tablesData } = await supabase
        .from('restaurant_tables')
        .select('*')
        .in('zone_id', zoneIds)
        .in('shape', ['rect', 'circle'])
        .order('table_number', { ascending: true });

      setTables(tablesData || []);
      setLoading(false);
    };

    fetchTables();
  }, [locationSlug, supabase]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 flex justify-center h-screen items-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="p-8 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Stampa QR Code Tavoli</h1>
          <p className="text-muted-foreground">{locationSlug}</p>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Stampa
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 print:grid-cols-3 print:gap-4">
        {tables.map(table => {
          // Using window.location.origin would be better but simple string is fine for now
          const url = isDev() ? `http://localhost:3000/order/${locationSlug}/${table.id}` : `https://smartables.app/order/${locationSlug}/${table.id}`;
          return (
            <div key={table.id} className="flex flex-col items-center p-6 border-2 border-dashed rounded-xl print:border-solid print:border-black break-inside-avoid page-break-inside-avoid">
              <h2 className="text-3xl font-bold mb-4">Tavolo {table.table_number}</h2>
              <div className="border-4 border-black p-2 rounded-lg">
                <QRCodeSVG value={url} size={180} level="H" />
              </div>
              <p className="mt-4 text-xs text-gray-500 font-mono text-center break-all">{url}</p>
              <p className="mt-2 text-sm font-medium uppercase tracking-wider">Scansiona per ordinare</p>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @media print {
            @page {
                margin: 1cm;
                size: A4;
            }
            body { 
                background: white;
                color: black; 
                -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
                display: none !important;
            }
            .page-break-inside-avoid {
                break-inside: avoid;
            }
        }
      `}</style>
    </div>
  );
}
