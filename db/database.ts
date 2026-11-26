import type { SQLiteDatabase } from 'expo-sqlite';

export type ExpenseCategory = 'Food' | 'Transport' | 'Bills' | 'Other';

export type Expense = {
  id: number;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
};

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      category TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `);
}

export async function addExpense(
  db: SQLiteDatabase,
  title: string,
  amount: number,
  category: ExpenseCategory
): Promise<number> {
  const date = new Date().toISOString().split('T')[0];
  const result = await db.runAsync(
    'INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)',
    [title.trim(), amount, category, date]
  );
  return result.lastInsertRowId;
}

export async function getFilteredExpenses(
  db: SQLiteDatabase,
  category: string,
  searchQuery: string
): Promise<Expense[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (searchQuery.trim()) {
    conditions.push('title LIKE ?');
    params.push(`%${searchQuery.trim()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<Expense>(
    `SELECT id, title, amount, category, date FROM expenses ${where} ORDER BY id DESC`,
    params
  );
}

export async function getFilteredTotal(
  db: SQLiteDatabase,
  category: string,
  searchQuery = ''
): Promise<number> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (searchQuery.trim()) {
    conditions.push('title LIKE ?');
    params.push(`%${searchQuery.trim()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount) AS total FROM expenses ${where}`,
    params
  );
  return result?.total ?? 0;
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  title: string,
  amount: number,
  category: ExpenseCategory
): Promise<void> {
  await db.runAsync(
    'UPDATE expenses SET title = ?, amount = ?, category = ? WHERE id = ?',
    [title.trim(), amount, category, id]
  );
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}
