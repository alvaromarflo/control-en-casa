import type { Gasto, GastoSubcategoria } from './types';
import { monthString, monthOfDate, parseDate, addPeriodToDate } from './dateHelpers';

/** Auto-detects subcategoria from the expense name via keyword matching. */
export function detectSubcategoria(nombre: string): GastoSubcategoria {
  const n = nombre.toLowerCase();
  if (/salud|médic|farmac|dentist|hospital|clínic|optometr|psicolog/.test(n)) return 'Salud';
  if (/factura|luz\b|agua\b|gas\b|electric|internet|wifi|teléfon|telefon|seguro|hipotec|alquiler|comunidad|ibi\b/.test(n)) return 'Facturas';
  if (/coche|gasolina|diesel|transport|bus\b|metro\b|tren\b|parking|taller|neumátic|itv\b|vehícul|moto\b/.test(n)) return 'Movilidad';
  if (/colegio|escuela|libro|uniforme|actividad|extraescolar|clase\b|curso|guardería|materiale|excursión|comedor/.test(n)) return 'Colegio';
  return 'Otro';
}

/**
 * Returns recurring gastos that are due in `currentMonth` but haven't been added yet.
 * A gasto is pending if:
 *   1. It's marked esRecurrente
 *   2. Its most recent occurrence is NOT in the current month
 *   3. The next due date falls within or before the current month's last day
 */
export function getPendingRecurring(gastos: Gasto[], currentMonth: Date): Gasto[] {
  const currentMonthKey = monthString(currentMonth);
  const recurring = gastos.filter((g) => g.esRecurrente);

  // For each unique (nombre, categoria), keep the most recent occurrence
  const latestByKey = new Map<string, Gasto>();
  for (const g of recurring) {
    const key = `${g.nombre}|${g.categoria}`;
    const existing = latestByKey.get(key);
    if (!existing || g.fecha > existing.fecha) {
      latestByKey.set(key, g);
    }
  }

  const pending: Gasto[] = [];
  for (const [, latest] of latestByKey) {
    // Skip if already confirmed this month
    const inCurrentMonth = recurring.some(
      (g) =>
        g.nombre === latest.nombre &&
        g.categoria === latest.categoria &&
        monthOfDate(g.fecha) === currentMonthKey,
    );
    if (inCurrentMonth) continue;

    // Skip if the latest entry itself is from this month
    if (monthOfDate(latest.fecha) === currentMonthKey) continue;

    // Check whether the next due date falls within or before current month
    const lastDate = parseDate(latest.fecha);
    const nextDate = addPeriodToDate(lastDate, latest.recurrenciaNumero, latest.recurrenciaTipo);
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const monthEnd = new Date(y, m + 1, 0); // last day of the month

    if (nextDate <= monthEnd) {
      pending.push(latest);
    }
  }

  return pending;
}
