# Get Your Exact Pooler Connection String

## Steps to Get the Correct DATABASE_URL:

1. **Go to your Supabase project dashboard**
2. **Click on "Connect" in the left sidebar**
3. **Click on the "Connection Pooling" tab**
4. **Copy the "URI" connection string**

The connection string should look like:
```
postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT_ID.pooler.supabase.co:6543/postgres
```

## What to look for:

- **Host**: Should end with `.pooler.supabase.co`
- **Port**: Should be `6543`
- **Database**: Should be `postgres`

## Common formats:

```
postgresql://postgres:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

OR

```
postgresql://postgres:password@project-id.pooler.supabase.co:6543/postgres
```

## Once you have the correct connection string:

1. Replace the DATABASE_URL in your `.env` file
2. Run: `npx prisma db push`
3. Then: `npx prisma studio`

## If it still fails:

Try these variations:
- Remove the `?pgbouncer=false` parameter
- Try with and without quotes around the URL
- Make sure there are no special characters in the password that need URL encoding
