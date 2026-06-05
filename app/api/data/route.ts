import { NextResponse } from 'next/server';
import {
  readTab,
  writeTab,
  ensureTabsExist,
  TABS,
} from '@/lib/sheetsClient';
import {
  rowToAttendance,
  rowToPayment,
  rowToGasto,
  rowsToSettings,
  attendanceToRow,
  paymentToRow,
  gastoToRow,
  settingsToRows,
} from '@/lib/serializers';
import type { AppStore } from '@/lib/types';

// ── GET /api/data — load full store from Sheets ───────────────────────────────

export async function GET() {
  try {
    await ensureTabsExist();

    const [attendanceRows, paymentRows, gastoRows, settingsRows] =
      await Promise.all([
        readTab(TABS.attendances),
        readTab(TABS.payments),
        readTab(TABS.gastos),
        readTab(TABS.settings),
      ]);

    const { settings, service } = rowsToSettings(settingsRows);

    const store: AppStore = {
      attendances: attendanceRows.filter((r) => r[0]).map(rowToAttendance),
      payments: paymentRows.filter((r) => r[0]).map(rowToPayment),
      gastos: gastoRows.filter((r) => r[0]).map(rowToGasto),
      settings,
      service,
    };

    return NextResponse.json(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[GET /api/data]', message);
    return NextResponse.json(
      { error: 'No se pudo cargar los datos.', detail: message },
      { status: 500 }
    );
  }
}

// ── POST /api/data — persist full store to Sheets ─────────────────────────────

export async function POST(req: Request) {
  try {
    const store: AppStore = await req.json();

    await ensureTabsExist();

    await Promise.all([
      writeTab(TABS.attendances, store.attendances.map(attendanceToRow)),
      writeTab(TABS.payments, store.payments.map(paymentToRow)),
      writeTab(TABS.gastos, store.gastos.map(gastoToRow)),
      writeTab(TABS.settings, settingsToRows(store)),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/data]', message);
    return NextResponse.json(
      { error: 'No se pudo guardar los datos.', detail: message },
      { status: 500 }
    );
  }
}
