// Get current database schema using Supabase client
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  'https://xxamplvcleizbfajsobd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YW1wbHZjbGVpemJmYWpzb2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzQyMjQsImV4cCI6MjA4OTA1MDIyNH0.rkisXqaF3TZZla0_4n-gyev5r9W_5S1s55r3ZttoP14'
)

async function getSchema() {
  try {
    // Get all table information
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.error('Error getting tables:', tablesError)
      return
    }

    console.log('=== CURRENT SUPABASE SCHEMA ===')
    console.log('Tables in public schema:')
    
    for (const table of tables || []) {
      console.log(`📋 ${table.table_name}`)
      
      // Get columns for this table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position')

      if (columnsError) {
        console.error(`Error getting columns for ${table.table_name}:`, columnsError)
        continue
      }

      console.log('  Columns:')
      for (const column of columns || []) {
        const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const defaultValue = column.column_default ? ` DEFAULT ${column.column_default}` : ''
        console.log(`    - ${column.column_name}: ${column.data_type} (${nullable})${defaultValue}`)
      }
      console.log('')
    }

    // Generate SQL schema file
    let sql = '-- Current Supabase Database Schema\n'
    sql += '-- Generated from live database\n'
    sql += '-- Date: ' + new Date().toISOString() + '\n\n'

    for (const table of tables || []) {
      sql += `-- Table: ${table.table_name}\n`
      
      // Get columns for this table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position')

      if (!columnsError && columns) {
        sql += `CREATE TABLE public.${table.table_name} (\n`
        
        columns.forEach((column, index) => {
          const comma = index < columns.length - 1 ? ',' : ''
          const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
          let type = column.data_type
          
          // Handle specific data types
          if (column.data_type === 'character varying') {
            type = `VARCHAR(${column.character_maximum_length || 255})`
          } else if (column.data_type === 'numeric') {
            type = `NUMERIC(${column.numeric_precision}, ${column.numeric_scale})`
          }
          
          const defaultValue = column.column_default ? ` DEFAULT ${column.column_default}` : ''
          
          sql += `  ${column.column_name} ${type} ${nullable}${defaultValue}${comma}\n`
        })
        
        sql += ');\n\n'
      }
    }

    // Write to file
    fs.writeFileSync('current_supabase_schema.sql', sql)
    console.log('✅ Schema saved to current_supabase_schema.sql')
    
  } catch (error) {
    console.error('Error getting schema:', error)
  }
}

getSchema()
