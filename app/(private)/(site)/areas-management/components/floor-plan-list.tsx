"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Pencil, Trash2, Lock, LockOpen } from "lucide-react";
import { Location } from "@/types/general";
import DataContainer from "@/components/utility/data-container";
import { Badge } from "@/components/ui/badge";
import { isZoneBlocked } from "@/lib/menu-helpers";
import { ButtonGroup } from "@/components/ui/button-group";

interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  updated_at?: string;
  blocked_from?: string | null;
  blocked_until?: string | null;
  blocked_reason?: string | null;
}

interface FloorPlanListProps {
  zones: Zone[];
  tables: any[]; // Changed to accept tables
  onEdit: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
  onBlock: (zone: Zone) => void;
  location: Location;
}

export function FloorPlanList({ zones, tables, onEdit, onDelete, onBlock, location }: FloorPlanListProps) {
  return (
    <DataContainer>
      {zones.map((zone) => {
        const zoneTables = tables.filter(t => t.zone_id === zone.id && t.seats > 0);
        return (
          <FloorPlanCard
            key={zone.id}
            zone={zone}
            zoneTables={zoneTables}
            onEdit={onEdit}
            onDelete={onDelete}
            onBlock={onBlock}
            location={location}
          />
        );
      })}
    </DataContainer>
  );
}

const FloorPlanCard = ({
  zone,
  zoneTables,
  onEdit,
  onDelete,
  onBlock,
  location
}: {
  zone: Zone,
  zoneTables: any[],
  onEdit: (zone: Zone) => void,
  onDelete: (zone: Zone) => void,
  onBlock: (zone: Zone) => void,
  location: Location
}) => {
  const blocked = isZoneBlocked(zone);
  const hasScheduledBlock = !blocked && zone.blocked_from && zone.blocked_until;

  return (
    <Card key={zone.id} className="group relative overflow-hidden shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg tracking-tight font-bold">
              {zone.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {zone.width}x{zone.height}px
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            {blocked && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                <Lock className="h-3 w-3 mr-1" />
                Bloccata
              </Badge>
            )}
            {hasScheduledBlock && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700">
                Blocco programmato
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm">{zoneTables.length} tavoli</p>
          {blocked && zone.blocked_reason && (
            <p className="text-xs text-muted-foreground italic truncate max-w-35">{zone.blocked_reason}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => onEdit(zone)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifica
        </Button>
        <ButtonGroup>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => onBlock(zone)}
            title={blocked ? "Sblocca sala" : "Blocca sala"}
          >
            {blocked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            Blocca
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            size="icon-sm"
            onClick={() => onDelete(zone)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ButtonGroup>
      </CardFooter>
    </Card>
  )
}
