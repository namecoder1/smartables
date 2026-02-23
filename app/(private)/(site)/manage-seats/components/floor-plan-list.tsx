"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Pencil, Trash2 } from "lucide-react";
import { Location } from "@/types/general";

interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  updated_at?: string;
}

interface FloorPlanListProps {
  zones: Zone[];
  tables: any[]; // Changed to accept tables
  onEdit: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
  location: Location;
}

export function FloorPlanList({ zones, tables, onEdit, onDelete, location }: FloorPlanListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {zones.map((zone) => {
        const zoneTables = tables.filter(t => t.zone_id === zone.id && t.seats > 0);
        return (
          <FloorPlanCard
            key={zone.id}
            zone={zone}
            zoneTables={zoneTables}
            onEdit={onEdit}
            onDelete={onDelete}
            location={location}
          />
        );
      })}
    </div>
  );
}

const FloorPlanCard = ({
  zone,
  zoneTables,
  onEdit,
  onDelete,
  location
}: {
  zone: Zone,
  zoneTables: any[],
  onEdit: (zone: Zone) => void,
  onDelete: (zone: Zone) => void,
  location: Location
}) => {
  return (
    <Card key={zone.id} className="group relative overflow-hidden shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="h-4 w-4 text-muted-foreground" />
              {zone.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {zone.width}x{zone.height}px
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm">{zoneTables.length} tavoli</p>
          <p className="text-sm">{zone.updated_at}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => onEdit(zone)}
        >
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Modifica
        </Button>
        <Button
          variant="destructive"
          className="cursor-pointer"
          size="sm"
          onClick={() => onDelete(zone)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}
