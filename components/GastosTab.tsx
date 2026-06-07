'use client';

import { useMemo, useState } from 'react';
import {
  Trash2,
  RefreshCw,
  Plus,
  Pencil,
  Bell,
  Heart,
  Receipt,
  Car,
  GraduationCap,
  Tag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddGastoDialog } from '@/components/AddGastoDialog';
import { monthString, monthOfDate, formatShortDate, dateString } from '@/lib/dateHelpers';
import { getPendingRecurring } from '@/lib/gastoHelpers';
import type { Gasto, GastoSubcategoria } from '@/lib/types';

interface GastosTabProps {
  currentMonth: Date;
  gastos: Gasto[];
  categoria: 'casa' | 'peques';
  onAdd: (gasto: Omit<Gasto, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Omit<Gasto, 'id'>>) => void;
}

export function GastosTab({
  currentMonth,
  gastos,
  categoria,
  onAdd,
  onDelete,
  onUpdate,
}: GastosTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [confirmingRecurring, setConfirmingRecurring] = useState<Gasto | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');

  const monthGastos = useMemo(() => {
    const key = monthString(currentMonth);
    return gastos
      .filter((g) => g.categoria === categoria && monthOfDate(g.fecha) === key)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [gastos, categoria, currentMonth]);

  const pending = useMemo(
    () => getPendingRecurring(gastos, currentMonth).filter((g) => g.categoria === categoria),
    [gastos, categoria, currentMonth],
  );

  const total = monthGastos.reduce((sum, g) => sum + g.cantidad, 0);

  const startConfirmRecurring = (g: Gasto) => {
    setConfirmingRecurring(g);
    setConfirmAmount(g.cantidad.toFixed(2));
  };

  const handleConfirmRecurring = () => {
    if (!confirmingRecurring) return;
    const num = parseFloat(confirmAmount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    onAdd({
      nombre: confirmingRecurring.nombre,
      cantidad: num,
      fecha: dateString(new Date()),
      esRecurrente: confirmingRecurring.esRecurrente,
      recurrenciaNumero: confirmingRecurring.recurrenciaNumero,
      recurrenciaTipo: confirmingRecurring.recurrenciaTipo,
      categoria: confirmingRecurring.categoria,
      subcategoria: confirmingRecurring.subcategoria,
    });
    setConfirmingRecurring(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Pending recurring banner */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 uppercase tracking-wide">
            <Bell className="h-3.5 w-3.5" />
            <span>Recurrentes pendientes</span>
          </div>
          {pending.map((g) => (
            <Card key={g.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{g.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.cantidad.toFixed(2).replace('.', ',')} € · cada {g.recurrenciaNumero}{' '}
                    {g.recurrenciaTipo}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => startConfirmRecurring(g)}>
                  Confirmar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Total bar */}
      {monthGastos.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Total del mes</span>
            <span className="text-lg font-bold">
              {total.toFixed(2).replace('.', ',')} €
            </span>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {monthGastos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-sm text-muted-foreground">Sin gastos este mes</p>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Añadir gasto
          </Button>
        </div>
      ) : (
        <>
          <Button onClick={() => setShowAdd(true)} className="w-full">
            <Plus className="h-4 w-4 mr-1.5" />
            Añadir gasto
          </Button>

          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {monthGastos.map((gasto) => (
                <GastoRow
                  key={gasto.id}
                  gasto={gasto}
                  onDelete={() => onDelete(gasto.id)}
                  onEdit={() => setEditingGasto(gasto)}
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add dialog */}
      <AddGastoDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        categoria={categoria}
        onAdd={onAdd}
      />

      {/* Edit dialog */}
      {editingGasto && (
        <AddGastoDialog
          open={!!editingGasto}
          onOpenChange={(v) => { if (!v) setEditingGasto(null); }}
          categoria={categoria}
          initialGasto={editingGasto}
          onAdd={onAdd}
          onUpdate={onUpdate}
        />
      )}

      {/* Confirm recurring dialog */}
      <Dialog
        open={!!confirmingRecurring}
        onOpenChange={(o) => { if (!o) setConfirmingRecurring(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar gasto recurrente</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium">{confirmingRecurring?.nombre}</p>
          <p className="text-xs text-muted-foreground -mt-2">
            Edita la cantidad si ha cambiado este mes.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="rec-amount">Cantidad (€)</Label>
            <Input
              id="rec-amount"
              type="number"
              inputMode="decimal"
              value={confirmAmount}
              onChange={(e) => setConfirmAmount(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmingRecurring(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRecurring}
              disabled={!confirmAmount || isNaN(parseFloat(confirmAmount.replace(',', '.')))}
            >
              Añadir este mes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Category icon ──────────────────────────────────────────────────────────────

function SubcategoriaIcon({ sub }: { sub?: GastoSubcategoria }) {
  const cls = 'h-4 w-4 shrink-0';
  switch (sub) {
    case 'Salud':
      return <Heart className={`${cls} text-rose-500`} />;
    case 'Facturas':
      return <Receipt className={`${cls} text-amber-500`} />;
    case 'Movilidad':
      return <Car className={`${cls} text-blue-500`} />;
    case 'Colegio':
      return <GraduationCap className={`${cls} text-green-600`} />;
    default:
      return <Tag className={`${cls} text-muted-foreground`} />;
  }
}

// ── Gasto row ──────────────────────────────────────────────────────────────────

function GastoRow({
  gasto,
  onDelete,
  onEdit,
}: {
  gasto: Gasto;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Category icon */}
      <SubcategoriaIcon sub={gasto.subcategoria} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{gasto.nombre}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatShortDate(gasto.fecha)}
          </span>
          {gasto.esRecurrente && (
            <Badge
              variant="secondary"
              className="text-blue-600 bg-blue-50 border-blue-200 text-xs gap-1 px-1.5 py-0"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Cada {gasto.recurrenciaNumero} {gasto.recurrenciaTipo}
            </Badge>
          )}
        </div>
      </div>

      <span className="font-semibold text-sm shrink-0">
        {gasto.cantidad.toFixed(2).replace('.', ',')} €
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
        onClick={onEdit}
        aria-label="Editar gasto"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        onClick={onDelete}
        aria-label="Eliminar gasto"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

