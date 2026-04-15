# Production Deployment Guide

## Prerequisites

1. **Supabase Project Setup**
   - Create a Supabase project at https://supabase.com
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
   - Run the RLS policies from `supabase/rls-policies.sql` in your Supabase SQL editor
   - Run the seed data from `supabase/seed.sql` if needed
   - Create a storage bucket named 'reports' in Supabase Storage with public access enabled

2. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Set your Supabase URL and anon key
   - Configure any additional environment variables

## Deployment Options

### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

Environment Variables in Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`

### 2. Netlify

```bash
# Build the application
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

Environment Variables in Netlify Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t hrms .
docker run -p 80:80 hrms
```

## Security Configuration

### Content Security Policy (CSP)

The application includes CSP headers. Ensure your hosting platform supports custom headers:

```nginx
# nginx.conf example
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; object-src 'none'";
```

### Required Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Database Setup

1. **Execute Schema**
   ```sql
   -- Run all commands in supabase/schema.sql
   ```

2. **Apply RLS Policies**
   ```sql
   -- Run all commands in supabase/rls-policies.sql
   ```

3. **Seed Data (Optional)**
   ```sql
   -- Run commands in supabase/seed.sql
   ```

## Performance Optimization

The application includes several performance optimizations:

1. **Code Splitting**: Routes are lazy-loaded for better initial load time
2. **Bundle Optimization**: Manual chunks for vendor libraries
3. **Tree Shaking**: Unused code is eliminated
4. **Minification**: JavaScript and CSS are minified in production
5. **Image Optimization**: Images are optimized and served in modern formats

## Monitoring and Logging

### Error Tracking

The application includes comprehensive error handling:

1. **Client-side Errors**: Caught by ErrorBoundary and sent to `/api/errors`
2. **Network Errors**: Logged with context and user information
3. **Performance Metrics**: Tracked and reported

### Analytics Setup

To enable analytics:

1. Set `VITE_ENABLE_ANALYTICS=true`
2. Add your analytics script to `public/index.html`
3. Configure tracking in `src/lib/analytics.ts`

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Health Checks

Add these endpoints to your monitoring:

- `/` - Application health
- `/api/health` - Detailed health status
- `/api/version` - Version information

## Rollback Procedures

### Vercel
```bash
vercel rollback [deployment-url]
```

### Netlify
```bash
netlify rollback --site=your-site.netlify.app
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Supabase CORS settings include your domain
2. **Authentication Issues**: Verify Supabase URL and keys are correct
3. **Build Failures**: Check all environment variables are set
4. **Performance Issues**: Verify code splitting and caching are working

### Debug Mode

Enable debug mode for development:
```bash
VITE_DEBUG_MODE=true npm run dev
```

## Maintenance

### Regular Tasks

1. **Database Backups**: Ensure Supabase backups are configured
2. **Security Updates**: Keep dependencies updated
3. **Performance Monitoring**: Review Core Web Vitals
4. **Error Monitoring**: Check error logs regularly

### Updates

```bash
# Update dependencies
npm update

# Test updates
npm run test

# Deploy
npm run build
# Deploy to your platform
```

## Support

For deployment issues:

1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure Supabase is accessible from your domain
4. Review the error logs in your hosting platform

## Compliance

### GDPR Compliance

- User data is stored in Supabase with GDPR compliance
- Data export and deletion features are available
- Cookie consent is implemented

### Accessibility

- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode support
