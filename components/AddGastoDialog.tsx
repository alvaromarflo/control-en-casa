'use client';

import { useState, useEffect } from 'react';
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
import { dateString } from '@/lib/dateHelpers';
import { detectSubcategoria } from '@/lib/gastoHelpers';
import type { Gasto, GastoSubcategoria } from '@/lib/types';

const RECURRENCIA_TIPOS = ['días', 'semanas', 'meses', 'años'];
const SUBCATEGORIAS: GastoSubcategoria[] = ['Salud', 'Facturas', 'Movilidad', 'Colegio', 'Otro'];

interface AddGastoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categoria: 'casa' | 'peques';
  /** Provide when editing an existing gasto */
  initialGasto?: Gasto;
  onAdd: (gasto: Omit<Gasto, 'id'>) => void;
  onUpdate?: (id: string, changes: Partial<Omit<Gasto, 'id'>>) => void;
}

export function AddGastoDialog({
  open,
  onOpenChange,
  categoria,
  initialGasto,
  onAdd,
  onUpdate,
}: AddGastoDialogProps) {
  const isEdit = !!initialGasto;

  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(dateString(new Date()));
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [recurrenciaNumero, setRecurrenciaNumero] = useState('1');
  const [recurrenciaTipo, setRecurrenciaTipo] = useState('meses');
  const [subcategoria, setSubcategoria] = useState<GastoSubcategoria>('Otro');

  // Pre-fill when editing
  useEffect(() => {
    if (initialGasto) {
      setNombre(initialGasto.nombre);
      setCantidad(initialGasto.cantidad.toFixed(2));
      setFecha(initialGasto.fecha);
      setEsRecurrente(initialGasto.esRecurrente);
      setRecurrenciaNumero(String(initialGasto.recurrenciaNumero));
      setRecurrenciaTipo(initialGasto.recurrenciaTipo);
      setSubcategoria(initialGasto.subcategoria ?? detectSubcategoria(initialGasto.nombre));
    }
  }, [initialGasto]);

  // Auto-detect subcategoria as user types (only in add mode)
  const handleNombreChange = (v: string) => {
    setNombre(v);
    if (!isEdit) {
      setSubcategoria(detectSubcategoria(v));
    }
  };

  const reset = () => {
    setNombre('');
    setCantidad('');
    setFecha(dateString(new Date()));
    setEsRecurrente(false);
    setRecurrenciaNumero('1');
    setRecurrenciaTipo('meses');
    setSubcategoria('Otro');
  };

  const handleSubmit = () => {
    const cantidadNum = parseFloat(cantidad.replace(',', '.'));
    if (!nombre.trim() || isNaN(cantidadNum) || cantidadNum <= 0) return;

    if (isEdit && onUpdate && initialGasto) {
      onUpdate(initialGasto.id, {
        nombre: nombre.trim(),
        cantidad: cantidadNum,
        fecha,
        esRecurrente,
        recurrenciaNumero: parseInt(recurrenciaNumero, 10) || 1,
        recurrenciaTipo,
        subcategoria,
      });
    } else {
      onAdd({
        nombre: nombre.trim(),
        cantidad: cantidadNum,
        fecha,
        esRecurrente,
        recurrenciaNumero: parseInt(recurrenciaNumero, 10) || 1,
        recurrenciaTipo,
        categoria,
        subcategoria,
      });
    }

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
          <DialogTitle>{isEdit ? 'Editar gasto' : 'Añadir gasto'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Concepto</Label>
            <Input
              id="nombre"
              placeholder="Ej. Seguro del hogar"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
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

          {/* Subcategoria */}
          <div className="space-y-1.5">
            <Label htmlFor="subcategoria">Categoría</Label>
            <select
              id="subcategoria"
              value={subcategoria}
              onChange={(e) => setSubcategoria(e.target.value as GastoSubcategoria)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            >
              {SUBCATEGORIAS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
              <select
                value={recurrenciaTipo}
                onChange={(e) => setRecurrenciaTipo(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
              >
                {RECURRENCIA_TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
            {isEdit ? 'Guardar' : 'Añadir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
