
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function EditorHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Guida Editor">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guida all'Editor di Sala</DialogTitle>
          <DialogDescription>
            Ottimizza la configurazione della tua sala e gestisci al meglio le capacità.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 1: Capacità */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="bg-primary/10 border border-primary/50 text-primary h-8 w-8 flex items-center justify-center">1</span> Gestione Capacità
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Ogni tavolo ha 3 valori di capacità che influenzano le prenotazioni automatiche:
            </p>
            <ul className="space-y-2 text-sm ml-1">
              <li className="flex gap-2">
                <span className="font-medium min-w-[120px]">Coperti Standard:</span>
                <span className="text-muted-foreground">La capacità ottimale e predefinita del tavolo.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium min-w-[120px]">Capacità Min:</span>
                <span className="text-muted-foreground">Il numero minimo di persone per occupare questo tavolo (es. non dare un tavolo da 6 a una coppia).</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium min-w-[120px]">Capacità Max:</span>
                <span className="text-muted-foreground">Il numero massimo di persone (es. aggiungendo una sedia a capotavola).</span>
              </li>
            </ul>
          </div>

          <div className="border-t my-4" />

          {/* Section 2: Tools */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="bg-primary/10 border border-primary/50 text-primary h-8 w-8 flex items-center justify-center">2</span> Strumenti Editor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="bg-input/30 p-3 rounded-lg">
                <h4 className="font-medium text-foreground mb-1">Snapping Intelligente</h4>
                Gli oggetti si allineano automaticamente alla griglia e agli altri oggetti. L'allineamento funziona sia per il centro che per i bordi.
              </div>
              <div className="bg-input/30 p-3 rounded-lg">
                <h4 className="font-medium text-foreground mb-1">Muri Personalizzabili</h4>
                Trascina un muro base e usa le maniglie <span className="text-primary font-bold">+</span> alle estremità per allungarlo o accorciarlo.
              </div>
              <div className="bg-input/30 p-3 rounded-lg">
                <h4 className="font-medium text-foreground mb-1">Rotazione</h4>
                Seleziona un oggetto e clicca sull'icona di rotazione (o usa il tasto <kbd className="border rounded px-1 text-xs">R</kbd> se disponibile) per ruotarlo di 90°.
              </div>
              <div className="bg-input/30 p-3 rounded-lg">
                <h4 className="font-medium text-foreground mb-1">Zoom & Pan</h4>
                Usa la rotella del mouse per zoomare. Tieni premuto e trascina lo sfondo per muoverti nella sala.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
