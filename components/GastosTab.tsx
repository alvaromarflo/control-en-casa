'use client';

import { useMemo, useState } from 'react';
import { Trash2, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddGastoDialog } from '@/components/AddGastoDialog';
import { monthString, monthOfDate, formatShortDate, formatLongDate } from '@/lib/dateHelpers';
import type { Gasto } from '@/lib/types';

interface GastosTabProps {
  currentMonth: Date;
  gastos: Gasto[];
  categoria: 'casa' | 'peques';
  onAdd: (gasto: Omit<Gasto, 'id'>) => void;
  onDelete: (id: string) => void;
}

export function GastosTab({
  currentMonth,
  gastos,
  categoria,
  onAdd,
  onDelete,
}: GastosTabProps) {
  const [showAdd, setShowAdd] = useState(false);

  const monthGastos = useMemo(() => {
    const key = monthString(currentMonth);
    return gastos
      .filter((g) => g.categoria === categoria && monthOfDate(g.fecha) === key)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [gastos, categoria, currentMonth]);

  const total = monthGastos.reduce((sum, g) => sum + g.cantidad, 0);

  return (
    <div className="flex flex-col gap-4 pb-6">
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
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {monthGastos.map((gasto) => (
                <GastoRow
                  key={gasto.id}
                  gasto={gasto}
                  onDelete={() => onDelete(gasto.id)}
                />
              ))}
            </CardContent>
          </Card>

          <Button onClick={() => setShowAdd(true)} className="w-full">
            <Plus className="h-4 w-4 mr-1.5" />
            Añadir gasto
          </Button>
        </>
      )}

      <AddGastoDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        categoria={categoria}
        onAdd={onAdd}
      />
    </div>
  );
}

// ── Gasto row ──────────────────────────────────────────────────────────────────

function GastoRow({
  gasto,
  onDelete,
}: {
  gasto: Gasto;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{gasto.nombre}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatShortDate(gasto.fecha)}
          </span>
          {gasto.esRecurrente && (
            <Badge variant="secondary" className="text-blue-600 bg-blue-50 border-blue-200 text-xs gap-1 px-1.5 py-0">
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
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        onClick={onDelete}
        aria-label="Eliminar gasto"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
