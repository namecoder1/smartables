
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Armchair,
  Trees,
  Sun,
  Coffee,
  Sparkles
} from 'lucide-react';
import {
  PRESET_SHAPES,
  ZONE_TYPES,
  PresetShape,
  ZoneType,
  generatePresetLayout
} from './zone-editor/zone-presets';
import { Zone, TableInstance } from './zone-editor/types';
import { Progress } from '@/components/ui/progress';
import { NumberInput } from '@/components/ui/number-input';

interface ZoneWizardProps {
  onComplete: (zone: Zone, tables: TableInstance[]) => void;
  onCancel: () => void;
}

const getIconForType = (type: ZoneType) => {
  switch (type) {
    case 'indoor': return <Armchair className="w-6 h-6" />;
    case 'outdoor': return <Trees className="w-6 h-6" />;
    case 'terrace': return <Sun className="w-6 h-6" />;
    case 'bar': return <Coffee className="w-6 h-6" />;
    default: return <Sparkles className="w-6 h-6" />;
  }
}

export default function ZoneWizard({ onComplete, onCancel }: ZoneWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<ZoneType | null>(null);
  const [selectedShape, setSelectedShape] = useState<PresetShape | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [zoneName, setZoneName] = useState('');

  const handleNext = () => {
    if (step === 1 && selectedType) setStep(2);
    if (step === 2 && selectedShape) {
      // Set default dimensions based on shape
      const preset = PRESET_SHAPES.find(p => p.id === selectedShape);
      if (preset) {
        setDimensions({ width: preset.defaultWidth, height: preset.defaultHeight });
      }
      // Set default name
      const typeLabel = ZONE_TYPES.find(t => t.id === selectedType)?.label || 'Sala';
      const shapeLabel = selectedShape === 'rectangle' ? '' : ` (${PRESET_SHAPES.find(p => p.id === selectedShape)?.label})`;
      setZoneName(`${typeLabel}${shapeLabel}`);

      setStep(3);
    }
  };

  const handleFinish = () => {
    if (!selectedType || !selectedShape) return;

    const zoneId = uuidv4();
    const newZone: Zone = {
      id: zoneId,
      name: zoneName || 'Nuova Sala',
      width: dimensions.width,
      height: dimensions.height,
    };

    const generatedTables = generatePresetLayout(
      selectedShape,
      dimensions.width,
      dimensions.height,
      zoneId
    );

    onComplete(newZone, generatedTables);
  };

  return (
    <div className="flex flex-col h-full flex-1">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center items-start gap-4 border-b pb-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crea Nuova Sala</h1>
          <p className="text-muted-foreground">Scegli la tipologia, la forma e configura la tua nuova sala</p>
        </div>
        <div className="w-full mt-0 lg:w-32 gap-1 text-sm text-muted-foreground">
          <Progress value={step === 1 ? 33 : step === 2 ? 64 : 100} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-6">

        {/* STEP 1: TYPE */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-1">
            {ZONE_TYPES.map((type) => (
              <Card
                key={type.id}
                className={`p-6 cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden
                    ${selectedType === type.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}
                `}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-full ${selectedType === type.id ? 'bg-primary/20' : 'bg-muted'}`}>
                    {getIconForType(type.id)}
                  </div>
                  {selectedType === type.id && <div className="bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>}
                </div>
                <h3 className="font-semibold text-lg mb-1">{type.label}</h3>
                <p className="text-sm text-muted-foreground">Configura layout per {type.label.toLowerCase()}</p>
              </Card>
            ))}
          </div>
        )}

        {/* STEP 2: SHAPE */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
            {PRESET_SHAPES.filter(shape => !shape.allowedTypes || (selectedType && shape.allowedTypes.includes(selectedType)))
              .map((shape) => (
                <Card
                  key={shape.id}
                  className={`p-6 cursor-pointer transition-all hover:border-primary/50 flex flex-col
                            ${selectedShape === shape.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}
                        `}
                  onClick={() => setSelectedShape(shape.id)}
                >
                  <div className="flex-1 flex items-center justify-center p-8 bg-muted/20 border-b mb-4 rounded-md">
                    {/* Visual Preview with SVG */}
                    <div className="w-32 h-24">
                      {shape.id === 'rectangle' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <rect x="1" y="1" width="126" height="94" rx="2" className="fill-background" />
                        </svg>
                      )}
                      {shape.id === 'l-shape' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <path d="M1,1 L1,95 L127,95 L127,63 L33,63 L33,1 Z" className="fill-background" strokeLinejoin="round" />
                        </svg>
                      )}
                      {shape.id === 'u-shape' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <path d="M1,1 L1,95 L127,95 L127,1 L95,1 L95,63 L33,63 L33,1 Z" className="fill-background" strokeLinejoin="round" />
                        </svg>
                      )}
                      {shape.id === 'open-space' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <rect x="1" y="1" width="126" height="94" rx="2" className="fill-background" />
                          <circle cx="43" cy="48" r="4" className="fill-foreground" />
                          <circle cx="85" cy="48" r="4" className="fill-foreground" />
                        </svg>
                      )}
                      {shape.id === 't-shape' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <path d="M1,1 L127,1 L127,30 L80,30 L80,95 L48,95 L48,30 L1,30 Z" className="fill-background" strokeLinejoin="round" />
                        </svg>
                      )}
                      {shape.id === 'gazebo' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <rect x="10" y="10" width="10" height="10" className="fill-foreground" />
                          <rect x="108" y="10" width="10" height="10" className="fill-foreground" />
                          <rect x="10" y="76" width="10" height="10" className="fill-foreground" />
                          <rect x="108" y="76" width="10" height="10" className="fill-foreground" />
                          <rect x="25" y="25" width="78" height="46" rx="2" className="stroke-dashed" strokeDasharray="4 4" />
                        </svg>
                      )}
                      {shape.id === 'gazebo-divided' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <rect x="10" y="25" width="108" height="46" rx="2" className="stroke-dashed" strokeDasharray="4 4" />
                          <rect x="10" y="25" width="10" height="10" className="fill-foreground" />
                          <rect x="59" y="25" width="10" height="10" className="fill-foreground" />
                          <rect x="108" y="25" width="10" height="10" className="fill-foreground" />
                          <rect x="10" y="61" width="10" height="10" className="fill-foreground" />
                          <rect x="59" y="61" width="10" height="10" className="fill-foreground" />
                          <rect x="108" y="61" width="10" height="10" className="fill-foreground" />
                          <line x1="42" y1="25" x2="42" y2="50" />
                          <line x1="86" y1="25" x2="86" y2="50" />
                        </svg>
                      )}
                      {shape.id === 'bar-counter' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <rect x="1" y="1" width="126" height="94" rx="2" className="stroke-muted" />
                          <path d="M20,20 L80,20 L80,35 L35,35 L35,80 L20,80 Z" className="fill-foreground" />
                        </svg>
                      )}
                      {shape.id === 'booth-hall' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <rect x="1" y="1" width="126" height="94" rx="2" className="fill-background" />
                          <line x1="1" y1="30" x2="20" y2="30" />
                          <line x1="1" y1="60" x2="20" y2="60" />
                          <line x1="108" y1="30" x2="127" y2="30" />
                          <line x1="108" y1="60" x2="127" y2="60" />
                        </svg>
                      )}
                      {shape.id === 'veranda-narrow' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <path d="M10,80 L10,20 L118,20 L118,80" className="fill-transparent stroke-foreground" strokeLinejoin="round" />
                        </svg>
                      )}
                      {shape.id === 'courtyard' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <rect x="10" y="10" width="108" height="76" rx="2" className="fill-background stroke-foreground" />
                          <rect x="44" y="38" width="40" height="20" rx="2" className="fill-transparent stroke-foreground" />
                        </svg>
                      )}
                      {shape.id === 'mezzanine' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-1">
                          <rect x="10" y="10" width="108" height="76" rx="2" className="fill-background stroke-dashed" strokeDasharray="4 4" />
                        </svg>
                      )}
                      {shape.id === 'lounge-open' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <path d="M10,30 L10,10 L30,10" className="fill-transparent stroke-foreground" strokeLinejoin="round" />
                          <path d="M98,10 L118,10 L118,30" className="fill-transparent stroke-foreground" strokeLinejoin="round" />
                          <path d="M10,66 L10,86 L30,86" className="fill-transparent stroke-foreground" strokeLinejoin="round" />
                          <path d="M98,86 L118,86 L118,66" className="fill-transparent stroke-foreground" strokeLinejoin="round" />
                        </svg>
                      )}
                      {shape.id === 'circular-room' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <ellipse cx="64" cy="48" rx="46" ry="36" className="fill-background stroke-foreground" />
                        </svg>
                      )}
                      {shape.id === 'circular-corner' && (
                        <svg width="100%" height="100%" viewBox="0 0 128 96" fill="none" className="stroke-foreground/50 stroke-2">
                          <path d="M10,10 L10,86 L118,86 L118,48 Q118,10 80,10 Z" className="fill-background stroke-foreground" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{shape.label}</h3>
                      {selectedShape === shape.id && <Check className="w-5 h-5 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{shape.description}</p>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* STEP 3: CONFIG */}
        {step === 3 && (
          <div className="space-y-6 px-1">
            <div className="space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className='flex flex-col gap-4'>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="zoneName">Nome Sala</Label>
                  <Input
                    id="zoneName"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="Es. Sala Principale"
                    className='h-12 bg-white!'
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="width">Larghezza (cm)</Label>
                    <NumberInput
                      id='width'
                      value={dimensions.width}
                      onValueChange={(value) => setDimensions(prev => ({ ...prev, width: value || 0 }))}
                      min={100}
                      context="default"
                      className='h-12 bg-white!'
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="height">Lunghezza (cm)</Label>
                    <NumberInput
                      id="height"
                      value={dimensions.height}
                      onValueChange={(value) => setDimensions(prev => ({ ...prev, height: value || 0 }))}
                      min={100}
                      context="default"
                      className='h-12 bg-white!'
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 h-fit p-4 bg-card rounded-3xl text-sm text-muted-foreground border-2 shadow-sm">
                <p className="font-medium text-foreground mb-1">Riepilogo</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tipologia: {ZONE_TYPES.find(t => t.id === selectedType)?.label}</li>
                  <li>Forma: {PRESET_SHAPES.find(s => s.id === selectedShape)?.label}</li>
                  <li>Dimensioni: {dimensions.width}x{dimensions.height} cm</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer / Actions */}
      <div className="border-t h-fit pt-4 flex justify-between">
        {step === 1 ? (
          <Button variant="ghost" onClick={onCancel}>Annulla</Button>
        ) : (
          <Button variant="outline" onClick={() => setStep(prev => (prev - 1) as any)}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Indietro
          </Button>
        )}

        <Button
          disabled={!selectedType || (step === 2 && !selectedShape)}
          onClick={step === 3 ? handleFinish : handleNext}
        >
          {step === 3 ? 'Crea Sala' : 'Continua'}
          {step !== 3 && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
