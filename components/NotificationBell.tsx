'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Gasto } from '@/lib/types';

interface NotificationBellProps {
  pending: Gasto[];
  onConfirm: (gasto: Gasto, cantidad: number) => void;
}

export function NotificationBell({ pending, onConfirm }: NotificationBellProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirming, setConfirming] = useState<Gasto | null>(null);
  const [amount, setAmount] = useState('');

  const startConfirm = (g: Gasto) => {
    setConfirming(g);
    setAmount(g.cantidad.toFixed(2));
  };

  const handleConfirm = () => {
    if (!confirming) return;
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    onConfirm(confirming, num);
    setConfirming(null);
    // Close sheet if all items confirmed
    if (pending.length <= 1) setSheetOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setSheetOpen(true)}
        aria-label={`Notificaciones${pending.length > 0 ? ` (${pending.length})` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {pending.length > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            {pending.length}
          </span>
        )}
      </Button>

      {/* Pending list sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] flex flex-col gap-4 rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Gastos recurrentes pendientes</SheetTitle>
          </SheetHeader>

          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay gastos recurrentes pendientes este mes.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map((g) => (
                <Card key={g.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.nombre}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 capitalize"
                        >
                          {g.categoria}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {g.cantidad.toFixed(2).replace('.', ',')} €
                        </span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => startConfirm(g)}>
                      Confirmar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Per-item confirm dialog */}
      <Dialog
        open={!!confirming}
        onOpenChange={(o) => {
          if (!o) setConfirming(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar gasto recurrente</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium">{confirming?.nombre}</p>
          <p className="text-xs text-muted-foreground -mt-2">
            Edita la cantidad si ha cambiado este mes.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="notif-amount">Cantidad (€)</Label>
            <Input
              id="notif-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!amount || isNaN(parseFloat(amount.replace(',', '.')))}
            >
              Añadir este mes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
