'use client';

import { useMemo } from 'react';
import { AttendanceRow } from '@/components/AttendanceRow';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  mondaysInMonth,
  dateString,
  monthString,
  monthOfDate,
} from '@/lib/dateHelpers';
import type { Attendance, AttendanceDay, AppStore } from '@/lib/types';

interface LimpiezaTabProps {
  currentMonth: Date;
  attendances: Attendance[];
  service: AppStore['service'];
  onToggle: (date: string) => void;
  onUpdate: (id: string, changes: Partial<Attendance>) => void;
}

export function LimpiezaTab({
  currentMonth,
  attendances,
  service,
  onToggle,
  onUpdate,
}: LimpiezaTabProps) {
  const { days, monthAttendances } = useMemo(() => {
    const key = monthString(currentMonth);
    const monthAttendances = attendances.filter(
      (a) => monthOfDate(a.date) === key
    );
    const mondays = mondaysInMonth(currentMonth);
    const days: AttendanceDay[] = mondays.map((monday) => {
      const ds = dateString(monday);
      return {
        date: ds,
        attendance: monthAttendances.find((a) => a.date === ds),
      };
    });
    return { days, monthAttendances };
  }, [currentMonth, attendances]);

  const presentCount = monthAttendances.filter((a) => a.present).length;
  const paidCount = monthAttendances.filter((a) => a.paid).length;
  const pendingCount = presentCount - paidCount;
  const totalAmount = presentCount * service.rate;
  const paidAmount = paidCount * service.rate;
  const pendingAmount = pendingCount * service.rate;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard
          label="Visitas"
          value={`${presentCount}`}
          sub={`de ${days.length}`}
        />
        <SummaryCard
          label="Total"
          value={formatEur(totalAmount)}
          valueClassName="text-blue-600"
        />
        <SummaryCard
          label="Pendiente"
          value={formatEur(pendingAmount)}
          valueClassName={pendingAmount > 0 ? 'text-orange-500' : 'text-green-600'}
        />
      </div>

      {/* Attendance list */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {days.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay lunes en este mes.
            </p>
          ) : (
            days.map((day, i) => (
              <div key={day.date} className="px-4">
                <AttendanceRow
                  day={day}
                  rate={service.rate}
                  onToggle={onToggle}
                  onUpdate={onUpdate}
                />
                {i < days.length - 1 && null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  valueClassName = '',
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-lg font-bold ${valueClassName}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function formatEur(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}
