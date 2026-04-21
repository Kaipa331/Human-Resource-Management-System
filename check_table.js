import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Client } = pg;

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'performance_goals'");
  console.log('Performance Goals Table:', res.rows);
  await client.end();
}
check();
