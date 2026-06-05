'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AppStore } from '@/lib/types';

interface SettingsSheetProps {
  service: AppStore['service'];
  settings: AppStore['settings'];
  onUpdateService: (changes: Partial<AppStore['service']>) => void;
  onUpdateSettings: (changes: Partial<AppStore['settings']>) => void;
}

export function SettingsSheet({
  service,
  settings,
  onUpdateService,
  onUpdateSettings,
}: SettingsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger
          aria-label="Ajustes"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="h-5 w-5" />
        </SheetTrigger>

      <SheetContent side="right" className="w-80 sm:w-96 p-5">
        <SheetHeader className="p-0">
          <SheetTitle>Ajustes</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* General */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              General
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="family-name">Nombre de familia</Label>
              <Input
                id="family-name"
                value={settings.familyName}
                onChange={(e) => onUpdateSettings({ familyName: e.target.value })}
                placeholder="Familia"
              />
              <p className="text-xs text-muted-foreground">
                Aparece en el saludo de la pantalla principal.
              </p>
            </div>
          </section>

          <Separator />

          {/* Apariencia */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Apariencia
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="theme">Tema</Label>
              <Select
                value={settings.theme}
                onValueChange={(v) => {
                  if (v) onUpdateSettings({ theme: v as AppStore['settings']['theme'] });
                }}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Servicio de limpieza */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Servicio de limpieza
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="service-name">Nombre del servicio</Label>
              <Input
                id="service-name"
                value={service.name}
                onChange={(e) => onUpdateService({ name: e.target.value })}
                placeholder="Limpieza"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-rate">Tarifa por visita (€)</Label>
              <Input
                id="service-rate"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                value={service.rate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) onUpdateService({ rate: val });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Importe que se suma al reporte por cada visita registrada.
              </p>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
