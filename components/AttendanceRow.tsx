'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Circle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatShortDate } from '@/lib/dateHelpers';
import type { AttendanceDay, Attendance } from '@/lib/types';

interface AttendanceRowProps {
  day: AttendanceDay;
  rate: number;
  onToggle: (date: string) => void;
  onUpdate: (id: string, changes: Partial<Attendance>) => void;
}

export function AttendanceRow({ day, rate, onToggle, onUpdate }: AttendanceRowProps) {
  const [open, setOpen] = useState(false);
  const { attendance } = day;

  const Icon = attendance
    ? attendance.present
      ? CheckCircle2
      : XCircle
    : Circle;

  const iconColor = attendance
    ? attendance.present
      ? 'text-green-500'
      : 'text-red-400'
    : 'text-muted-foreground';

  return (
    <>
      <div className="flex items-center gap-3 py-3 px-1">
        {/* Toggle button */}
        <button
          onClick={() => onToggle(day.date)}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cambiar asistencia"
        >
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </button>

        {/* Date + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium capitalize">
            {formatShortDate(day.date)}
          </p>
          <StatusBadge attendance={attendance} rate={rate} />
        </div>

        {/* Edit button — only if there is a record */}
        {attendance && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground shrink-0 -mr-2"
            onClick={() => setOpen(true)}
          >
            Editar
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Detail dialog */}
      {attendance && (
        <AttendanceDetailDialog
          open={open}
          onOpenChange={setOpen}
          attendance={attendance}
          date={day.date}
          rate={rate}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({
  attendance,
  rate,
}: {
  attendance: Attendance | undefined;
  rate: number;
}) {
  if (!attendance) {
    return <p className="text-xs text-muted-foreground">Sin registrar</p>;
  }
  if (attendance.paid) {
    return (
      <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200 text-xs">
        ✓ Pagado
      </Badge>
    );
  }
  if (attendance.present) {
    return (
      <p className="text-xs text-blue-600">
        Vino · {rate.toFixed(2).replace('.', ',')} €
      </p>
    );
  }
  return <p className="text-xs text-muted-foreground">No viene</p>;
}

// ── Detail dialog ──────────────────────────────────────────────────────────────

function AttendanceDetailDialog({
  open,
  onOpenChange,
  attendance,
  date,
  rate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  attendance: Attendance;
  date: string;
  rate: number;
  onUpdate: (id: string, changes: Partial<Attendance>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="capitalize">{formatShortDate(date)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="paid-switch" className="text-sm font-medium">
              Pagado ({rate.toFixed(2).replace('.', ',')} €)
            </Label>
            <Switch
              id="paid-switch"
              checked={attendance.paid}
              onCheckedChange={(checked) =>
                onUpdate(attendance.id, { paid: checked })
              }
              disabled={!attendance.present}
            />
          </div>

          {!attendance.present && (
            <p className="text-xs text-muted-foreground">
              Solo se puede marcar como pagado si la persona vino.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
