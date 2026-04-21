import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function apply() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const sql = fs.readFileSync('supabase/migrations/20260421094500_add_department_to_goals.sql', 'utf8');
    await client.query(sql);
    console.log('Performance goals migration applied.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
apply();
