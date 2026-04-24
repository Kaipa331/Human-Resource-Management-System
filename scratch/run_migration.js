import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const runMigration = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(process.cwd(), 'supabase/migrations/20260422090000_employee_documents.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sql);
        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Error executing migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
};

runMigration();
