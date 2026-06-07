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
  addMonths,
} from '@/lib/dateHelpers';
import type { Attendance, Payment, Gasto, AppStore } from '@/lib/types';

interface ReporteTabProps {
  currentMonth: Date;
  attendances: Attendance[];
  payments: Payment[];
  gastos: Gasto[];
  service: AppStore['service'];
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeletePayment: (id: string) => void;
}

export function ReporteTab({
  currentMonth,
  attendances,
  payments,
  gastos,
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

    const gastosCasa = gastos
      .filter((g) => g.categoria === 'casa' && monthOfDate(g.fecha) === monthKey)
      .reduce((s, g) => s + g.cantidad, 0);
    const gastosPeques = gastos
      .filter((g) => g.categoria === 'peques' && monthOfDate(g.fecha) === monthKey)
      .reduce((s, g) => s + g.cantidad, 0);

    return {
      monthly: {
        key: monthKey,
        visitCount,
        totalAmount,
        totalPaid,
        outstanding,
        payments: monthPayments,
        gastosCasa,
        gastosPeques,
      },
      yearly: {
        year,
        visitCount: yearVisitCount,
        totalAmount: yearTotalAmount,
        totalPaid: yearTotalPaid,
        outstanding: yearOutstanding,
      },
    };
  }, [currentMonth, attendances, payments, gastos, service.rate]);

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
      {/* Gastos del mes — all 3 categories */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Gastos del mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <ReportRow label="Limpieza" value={eur(monthly.totalAmount)} />
          <ReportRow label="Casa" value={eur(monthly.gastosCasa)} />
          <ReportRow label="Peques" value={eur(monthly.gastosPeques)} />
          <Separator />
          <ReportRow
            label="Total"
            value={eur(monthly.totalAmount + monthly.gastosCasa + monthly.gastosPeques)}
          />
        </CardContent>
      </Card>

      {/* Monthly spending chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Evolución últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <MonthlySpendingChart gastos={gastos} currentMonth={currentMonth} />
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

// ── Monthly spending chart ─────────────────────────────────────────────────────

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const BAR_HEIGHT = 100; // px

function MonthlySpendingChart({
  gastos,
  currentMonth,
}: {
  gastos: Gasto[];
  currentMonth: Date;
}) {
  const months = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const mKey = monthString(addMonths(currentMonth, -i));
      const monthIdx = parseInt(mKey.slice(5, 7), 10) - 1;
      const casa = gastos
        .filter((g) => g.categoria === 'casa' && monthOfDate(g.fecha) === mKey)
        .reduce((s, g) => s + g.cantidad, 0);
      const peques = gastos
        .filter((g) => g.categoria === 'peques' && monthOfDate(g.fecha) === mKey)
        .reduce((s, g) => s + g.cantidad, 0);
      result.push({ mKey, monthIdx, casa, peques, total: casa + peques });
    }
    return result;
  }, [gastos, currentMonth]);

  const maxTotal = Math.max(...months.map((m) => m.total), 1);
  const currentKey = monthString(currentMonth);

  return (
    <div className="w-full">
      {/* Bars */}
      <div className="flex items-end gap-1.5" style={{ height: BAR_HEIGHT }}>
        {months.map(({ mKey, casa, peques, total }) => {
          const barH = Math.round((total / maxTotal) * BAR_HEIGHT);
          const casaH = total > 0 ? Math.round((casa / total) * barH) : 0;
          const pequesH = barH - casaH;
          const isCurrent = mKey === currentKey;
          return (
            <div key={mKey} className="flex-1 flex flex-col justify-end">
              {total > 0 ? (
                <div
                  title={`${MONTH_ABBR[parseInt(mKey.slice(5,7),10)-1]}: ${eur(total)}`}
                  style={{ height: barH }}
                  className={`flex flex-col justify-end rounded-t overflow-hidden ${isCurrent ? 'opacity-100' : 'opacity-70'}`}
                >
                  {peques > 0 && (
                    <div
                      style={{ height: pequesH }}
                      className="bg-violet-400 dark:bg-violet-500"
                    />
                  )}
                  {casa > 0 && (
                    <div
                      style={{ height: casaH }}
                      className="bg-sky-400 dark:bg-sky-500"
                    />
                  )}
                </div>
              ) : (
                <div
                  style={{ height: 2 }}
                  className="bg-border rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-1.5 mt-1.5">
        {months.map(({ mKey, monthIdx }) => (
          <div
            key={mKey}
            className={`flex-1 text-center text-xs ${mKey === currentKey ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
          >
            {MONTH_ABBR[monthIdx]}
          </div>
        ))}
      </div>

      {/* Total labels */}
      <div className="flex gap-1.5 mt-0.5">
        {months.map(({ mKey, total }) => (
          <div key={mKey} className="flex-1 text-center text-[10px] text-muted-foreground leading-tight">
            {total > 0 ? `${Math.round(total)}€` : '—'}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
          <span>Casa</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-400" />
          <span>Peques</span>
        </div>
      </div>
    </div>
  );
}
