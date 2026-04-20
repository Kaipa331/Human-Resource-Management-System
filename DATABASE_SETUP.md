# Database Setup Guide

## Prerequisites

Before starting, ensure you have:
- Node.js installed
- PostgreSQL database running
- Supabase project created and configured

## Step 1: Install Prisma CLI

```bash
npm install -g prisma
npx prisma init
```

## Step 2: Configure Database Connection

Create `.env` file in your project root:

```env
# Supabase Configuration
DATABASE_URL="your-supabase-project-url-here"
```

## Step 3: Generate Prisma Client

```bash
npx prisma generate
```

## Step 4: Push Schema to Database

```bash
npx prisma db push
```

## Step 5: Start Using Prisma

Now you can use Prisma for all database operations:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Example: Create a new employee
const newEmployee = await prisma.employee.create({
  data: {
    name: "John Doe",
    email: "john@example.com",
    employeeId: "EMP123",
    department: "Engineering",
    position: "Software Developer",
    salary: 75000,
    status: "Active"
  }
})

// Example: Query employees
const employees = await prisma.employee.findMany({
  where: {
    status: "Active"
  },
  orderBy: {
    createdAt: "desc"
  }
})
```

## Step 6: Update Package.json

Add Prisma scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

## Step 7: Start Prisma Studio (Optional)

For visual database management:

```bash
npx prisma studio
```

## Benefits

✅ **Type Safety**: Full TypeScript support with generated types
✅ **Auto-completion**: IDE support for database queries
✅ **Database Studio**: Visual interface for database management
✅ **Migrations**: Version-controlled schema changes
✅ **Direct SQL Access**: When needed through Prisma queries

## Migration from Supabase Client

If you want to migrate existing data:

1. Export current data from Supabase
2. Use Prisma to import the data
3. Update your application code to use Prisma instead of Supabase client

## Next Steps

1. Replace Supabase client imports with Prisma client
2. Update all database operations to use Prisma
3. Test all CRUD operations
4. Deploy with confidence

This setup gives you professional database management with full type safety and modern tooling!
