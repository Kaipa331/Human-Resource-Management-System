import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function apply() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const sql = fs.readFileSync('supabase/migrations/20260421102000_fix_training_rls.sql', 'utf8');
    await client.query(sql);
    console.log('Training RLS patch applied.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
apply();
