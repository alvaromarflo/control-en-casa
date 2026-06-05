'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dateString } from '@/lib/dateHelpers';
import type { Gasto } from '@/lib/types';

interface AddGastoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoria: 'casa' | 'peques';
  onAdd: (gasto: Omit<Gasto, 'id'>) => void;
}

const RECURRENCIA_TIPOS = ['días', 'semanas', 'meses', 'años'];

export function AddGastoDialog({
  open,
  onOpenChange,
  categoria,
  onAdd,
}: AddGastoDialogProps) {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(dateString(new Date()));
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [recurrenciaNumero, setRecurrenciaNumero] = useState('1');
  const [recurrenciaTipo, setRecurrenciaTipo] = useState('meses');

  const reset = () => {
    setNombre('');
    setCantidad('');
    setFecha(dateString(new Date()));
    setEsRecurrente(false);
    setRecurrenciaNumero('1');
    setRecurrenciaTipo('meses');
  };

  const handleSubmit = () => {
    const cantidadNum = parseFloat(cantidad.replace(',', '.'));
    if (!nombre.trim() || isNaN(cantidadNum) || cantidadNum <= 0) return;

    onAdd({
      nombre: nombre.trim(),
      cantidad: cantidadNum,
      fecha,
      esRecurrente,
      recurrenciaNumero: parseInt(recurrenciaNumero, 10) || 1,
      recurrenciaTipo,
      categoria,
    });

    reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Añadir gasto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Concepto</Label>
            <Input
              id="nombre"
              placeholder="Ej. Seguro del hogar"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
          </div>

          {/* Cantidad */}
          <div className="space-y-1.5">
            <Label htmlFor="cantidad">Cantidad (€)</Label>
            <Input
              id="cantidad"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {/* Recurrente */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recurrente" className="text-sm font-medium">
              Gasto recurrente
            </Label>
            <Switch
              id="recurrente"
              checked={esRecurrente}
              onCheckedChange={setEsRecurrente}
            />
          </div>

          {esRecurrente && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground shrink-0">Cada</span>
              <Input
                type="number"
                inputMode="numeric"
                className="w-16 text-center"
                value={recurrenciaNumero}
                onChange={(e) => setRecurrenciaNumero(e.target.value)}
                min={1}
              />
              <Select value={recurrenciaTipo} onValueChange={(v) => { if (v) setRecurrenciaTipo(v); }}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCIA_TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !nombre.trim() ||
              !cantidad ||
              isNaN(parseFloat(cantidad.replace(',', '.')))
            }
          >
            Añadir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
