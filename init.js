import fs from 'node:fs/promises';
import { pool } from './pool.js';
const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8');
const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
for (const statement of statements) await pool.query(statement);
console.log('PayGlow database schema initialized.');
await pool.end();
