import { google } from 'googleapis';

// Sheets tab names — one per data type
export const TABS = {
  attendances: 'Attendances',
  payments: 'Payments',
  gastos: 'Gastos',
  settings: 'Settings',
} as const;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars');
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error('Missing GOOGLE_SPREADSHEET_ID env var');
  return id;
}

/** Read all rows from a tab (excluding header row). */
export async function readTab(tab: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A2:Z`,
  });

  return (res.data.values as string[][] | null) ?? [];
}

/** Overwrite all data rows in a tab (keeps header row intact). */
export async function writeTab(tab: string, rows: string[][]): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // Clear from row 2 onwards
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tab}!A2:Z`,
  });

  if (rows.length === 0) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
}

/** Ensure all required tabs exist with their header rows. */
export async function ensureTabsExist(): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = new Set(
    meta.data.sheets?.map((s) => s.properties?.title ?? '') ?? []
  );

  const HEADERS: Record<string, string[]> = {
    [TABS.attendances]: ['id', 'date', 'present', 'paid', 'hours', 'createdAt'],
    [TABS.payments]:    ['id', 'amount', 'date', 'relatedMonth', 'note'],
    [TABS.gastos]:      ['id', 'nombre', 'cantidad', 'fecha', 'esRecurrente', 'recurrenciaNumero', 'recurrenciaTipo', 'categoria'],
    [TABS.settings]:    ['key', 'value'],
  };

  const addRequests = Object.entries(HEADERS)
    .filter(([title]) => !existingTitles.has(title))
    .map(([title]) => ({
      addSheet: { properties: { title } },
    }));

  if (addRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: addRequests },
    });
  }

  // Write headers for any tab that was just created or is missing them
  for (const [title, headers] of Object.entries(HEADERS)) {
    if (!existingTitles.has(title)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }
  }
}
