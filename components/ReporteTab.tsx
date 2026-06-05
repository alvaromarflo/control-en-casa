'use client';

import { useMemo, useState } from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  monthString,
  monthOfDate,
  yearOfMonth,
  displayMonth,
  formatShortDate,
  dateString,
} from '@/lib/dateHelpers';
import type { Attendance, Payment, AppStore } from '@/lib/types';

interface ReporteTabProps {
  currentMonth: Date;
  attendances: Attendance[];
  payments: Payment[];
  service: AppStore['service'];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeletePayment: (id: string) => void;
}

export function ReporteTab({
  currentMonth,
  attendances,
  payments,
  service,
  onAddPayment,
  onDeletePayment,
}: ReporteTabProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { monthly, yearly } = useMemo(() => {
    const monthKey = monthString(currentMonth);
    const year = yearOfMonth(monthKey);

    const monthAttendances = attendances.filter(
      (a) => monthOfDate(a.date) === monthKey
    );
    const monthPayments = payments.filter((p) => p.relatedMonth === monthKey);

    const yearAttendances = attendances.filter(
      (a) => yearOfMonth(monthOfDate(a.date)) === year
    );
    const yearPayments = payments.filter(
      (p) => yearOfMonth(p.relatedMonth) === year
    );

    const visitCount = monthAttendances.filter((a) => a.present).length;
    const totalAmount = visitCount * service.rate;
    const totalPaid = monthPayments.reduce((s, p) => s + p.amount, 0);
    const outstanding = Math.max(0, totalAmount - totalPaid);

    const yearVisitCount = yearAttendances.filter((a) => a.present).length;
    const yearTotalAmount = yearVisitCount * service.rate;
    const yearTotalPaid = yearPayments.reduce((s, p) => s + p.amount, 0);
    const yearOutstanding = Math.max(0, yearTotalAmount - yearTotalPaid);

    return {
      monthly: {
        key: monthKey,
        visitCount,
        totalAmount,
        totalPaid,
        outstanding,
        payments: monthPayments,
      },
      yearly: {
        year,
        visitCount: yearVisitCount,
        totalAmount: yearTotalAmount,
        totalPaid: yearTotalPaid,
        outstanding: yearOutstanding,
      },
    };
  }, [currentMonth, attendances, payments, service.rate]);

  const handleMarkPaid = () => {
    if (monthly.outstanding <= 0) return;
    onAddPayment({
      amount: monthly.outstanding,
      date: dateString(new Date()),
      relatedMonth: monthly.key,
      note: '',
    });
    setConfirmOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Monthly summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resumen del mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <ReportRow label="Visitas registradas" value={`${monthly.visitCount}`} />
          <ReportRow label="Total a pagar" value={eur(monthly.totalAmount)} />
          <ReportRow label="Pagado" value={eur(monthly.totalPaid)} />
          <Separator />
          <ReportRow
            label="Pendiente"
            value={eur(monthly.outstanding)}
            highlight={monthly.outstanding > 0}
          />
        </CardContent>
      </Card>

      {/* Annual summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resumen anual {yearly.year}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <ReportRow label="Visitas del año" value={`${yearly.visitCount}`} />
          <ReportRow label="Total generado" value={eur(yearly.totalAmount)} />
          <ReportRow label="Pagado acumulado" value={eur(yearly.totalPaid)} />
          <Separator />
          <ReportRow
            label="Pendiente anual"
            value={eur(yearly.outstanding)}
            highlight={yearly.outstanding > 0}
          />
        </CardContent>
      </Card>

      {/* Payments list */}
      {monthly.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pagos del mes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {monthly.payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">
                    {formatShortDate(payment.date)}
                  </p>
                  {payment.note && (
                    <p className="text-xs text-muted-foreground">{payment.note}</p>
                  )}
                </div>
                <span className="font-semibold text-sm">{eur(payment.amount)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeletePayment(payment.id)}
                  aria-label="Eliminar pago"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mark as paid CTA */}
      {monthly.outstanding > 0 && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => setConfirmOpen(true)}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Marcar mes pagado ({eur(monthly.outstanding)})
        </Button>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Registrar pago?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se registrará un pago de{' '}
            <strong>{eur(monthly.outstanding)}</strong> para{' '}
            {displayMonth(currentMonth)}.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkPaid}>
              Confirmar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ReportRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-orange-500' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function eur(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}
