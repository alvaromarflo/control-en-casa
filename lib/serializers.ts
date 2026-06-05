import type { Attendance, Payment, Gasto, AppStore } from '@/lib/types';

// ── Attendances ───────────────────────────────────────────────────────────────

export function attendanceToRow(a: Attendance): string[] {
  return [
    a.id,
    a.date,
    a.present ? '1' : '0',
    a.paid ? '1' : '0',
    a.hours != null ? String(a.hours) : '',
    a.createdAt,
  ];
}

export function rowToAttendance(r: string[]): Attendance {
  return {
    id: r[0],
    date: r[1],
    present: r[2] === '1',
    paid: r[3] === '1',
    hours: r[4] !== '' ? Number(r[4]) : undefined,
    createdAt: r[5] ?? new Date().toISOString(),
  };
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function paymentToRow(p: Payment): string[] {
  return [p.id, String(p.amount), p.date, p.relatedMonth, p.note];
}

export function rowToPayment(r: string[]): Payment {
  return {
    id: r[0],
    amount: Number(r[1]),
    date: r[2],
    relatedMonth: r[3],
    note: r[4] ?? '',
  };
}

// ── Gastos ────────────────────────────────────────────────────────────────────

export function gastoToRow(g: Gasto): string[] {
  return [
    g.id,
    g.nombre,
    String(g.cantidad),
    g.fecha,
    g.esRecurrente ? '1' : '0',
    String(g.recurrenciaNumero),
    g.recurrenciaTipo,
    g.categoria,
  ];
}

export function rowToGasto(r: string[]): Gasto {
  return {
    id: r[0],
    nombre: r[1],
    cantidad: Number(r[2]),
    fecha: r[3],
    esRecurrente: r[4] === '1',
    recurrenciaNumero: Number(r[5]) || 1,
    recurrenciaTipo: r[6] ?? 'meses',
    categoria: (r[7] as Gasto['categoria']) ?? 'casa',
  };
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function settingsToRows(store: AppStore): string[][] {
  return [
    ['familyName', store.settings.familyName],
    ['theme', store.settings.theme],
    ['serviceName', store.service.name],
    ['serviceRate', String(store.service.rate)],
  ];
}

export function rowsToSettings(
  rows: string[][]
): Pick<AppStore, 'settings' | 'service'> {
  const map = Object.fromEntries(rows.map((r) => [r[0], r[1]]));
  return {
    settings: {
      familyName: map['familyName'] ?? 'Familia',
      theme: (map['theme'] as AppStore['settings']['theme']) ?? 'auto',
    },
    service: {
      name: map['serviceName'] ?? 'Limpieza',
      rate: Number(map['serviceRate']) || 45.5,
    },
  };
}
