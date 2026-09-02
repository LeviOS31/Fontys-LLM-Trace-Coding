import { Pool } from 'pg';

let db: Pool | null = null;

export function getPool(): Pool {
  if (!db) {
    const connectionString = process.env.TEST_DATABASE_URL;

    if (!connectionString) {
      throw new Error('TEST_DATABASE_URL is not defined');
    }

    db = new Pool({ connectionString });
  }

  return db;
}
