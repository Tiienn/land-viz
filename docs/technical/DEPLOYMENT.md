# Deployment Guide
**Land Visualizer Production Deployment & DevOps**  
*Version 1.0 | August 2025*

---

## 🚀 Quick Deploy

### One-Command Deploy (Production)
```bash
# Deploy to production (requires configured environment)
npm run deploy:prod

# What this does:
# 1. Runs tests
# 2. Builds optimized bundle
# 3. Uploads to CDN
# 4. Invalidates cache
# 5. Updates DNS
```

---

## 🌍 Environment Overview

### Environment Pipeline

```
Development → Staging → Production
    ↓           ↓           ↓
localhost   preview.url   app.url
```

| Environment | URL | Purpose | Deploy Trigger |
|------------|-----|---------|----------------|
| **Development** | http://localhost:3000 | Local development | Manual |
| **Preview** | https://preview-{pr}.landvisualizer.com | PR previews | PR opened |
| **Staging** | https://staging.landvisualizer.com | Pre-production testing | Push to `staging` |
| **Production** | https://landvisualizer.com | Live application | Push to `main` |

---

## 🏗️ Infrastructure Architecture

### Deployment Stack

```
┌─────────────────────────────────────────┐
│           Cloudflare (CDN)              │
│         Global Edge Network             │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          Vercel / Netlify               │
│      Static Hosting + Functions         │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         GitHub Actions                  │
│         CI/CD Pipeline                  │
└─────────────────────────────────────────┘
```

---

## 📦 Build Configuration

### Production Build Settings

```javascript
// vite.config.prod.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          'chili3d': ['@chili3d/core', '@chili3d/geometry'],
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'process.env.BUILD_VERSION': JSON.stringify(process.env.npm_package_version)
  }
});
```

### Build Scripts

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production",
    "build:analyze": "vite build --mode production && npx vite-bundle-visualizer",
    "build:wasm": "npm run wasm:compile && npm run wasm:optimize",
    "wasm:compile": "emcc src/wasm/geometry.c -o public/wasm/geometry.wasm -O3",
    "wasm:optimize": "wasm-opt public/wasm/geometry.wasm -O3 -o public/wasm/geometry.wasm"
  }
}
```

---

## 🔧 Environment Variables

### Configuration Files

```bash
# .env.production
VITE_APP_ENV=production
VITE_API_URL=https://api.landvisualizer.com
VITE_CDN_URL=https://cdn.landvisualizer.com
VITE_WASM_PATH=/wasm/
VITE_ENABLE_PRECISION=true
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_ENABLE_PWA=true
```

```bash
# .env.staging
VITE_APP_ENV=staging
VITE_API_URL=https://staging-api.landvisualizer.com
VITE_CDN_URL=https://staging-cdn.landvisualizer.com
VITE_WASM_PATH=/wasm/
VITE_ENABLE_PRECISION=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Environment Variable Management

```typescript
// src/config/environment.ts
interface Environment {
  production: boolean;
  staging: boolean;
  development: boolean;
  features: {
    precisionMode: boolean;
    analytics: boolean;
    pwa: boolean;
    debug: boolean;
  };
  urls: {
    api: string;
    cdn: string;
    wasm: string;
  };
}

export const env: Environment = {
  production: import.meta.env.VITE_APP_ENV === 'production',
  staging: import.meta.env.VITE_APP_ENV === 'staging',
  development: import.meta.env.DEV,
  features: {
    precisionMode: import.meta.env.VITE_ENABLE_PRECISION === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true'
  },
  urls: {
    api: import.meta.env.VITE_API_URL,
    cdn: import.meta.env.VITE_CDN_URL,
    wasm: import.meta.env.VITE_WASM_PATH
  }
};
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  DEPLOY_TIMEOUT: '600'

jobs:
  # 1. Test Job
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, e2e]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}
      
      - name: Upload coverage
        if: matrix.test-type == 'unit'
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # 2. Build Job
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build WASM modules
        run: |
          npm run wasm:compile
          npm run wasm:optimize
      
      - name: Build application
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            npm run build:prod
          else
            npm run build:staging
          fi
        env:
          VITE_BUILD_VERSION: ${{ github.sha }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/
          retention-days: 7

  # 3. Security Scan
  security:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          path: '.'
          format: 'HTML'

  # 4. Performance Check
  performance:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          runs: 3
          budgetPath: .github/lighthouse-budget.json
      
      - name: Check bundle size
        run: |
          MAX_SIZE=5242880  # 5MB in bytes
          ACTUAL_SIZE=$(du -sb dist | cut -f1)
          if [ $ACTUAL_SIZE -gt $MAX_SIZE ]; then
            echo "Bundle size ($ACTUAL_SIZE) exceeds limit ($MAX_SIZE)"
            exit 1
          fi

  # 5. Deploy Preview (PRs)
  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: [build, security]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./dist
          alias-domains: preview-pr${{ github.event.pull_request.number }}.landvisualizer.com
      
      - name: Comment PR with preview URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed to: https://preview-pr${{ github.event.pull_request.number }}.landvisualizer.com`
            })

  # 6. Deploy Staging
  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: [build, security, performance]
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to Staging
        run: |
          npx netlify deploy \
            --dir=dist \
            --site=${{ secrets.NETLIFY_SITE_ID }} \
            --auth=${{ secrets.NETLIFY_AUTH_TOKEN }} \
            --prod
      
      - name: Invalidate CDN cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'

  # 7. Deploy Production
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [build, security, performance]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to Production
        run: |
          npx netlify deploy \
            --dir=dist \
            --site=${{ secrets.NETLIFY_PROD_SITE_ID }} \
            --auth=${{ secrets.NETLIFY_AUTH_TOKEN }} \
            --prod
      
      - name: Invalidate CDN cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_PROD_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
      
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: |
            Production deployment completed
            Commit: ${{ github.sha }}
```

---

## 🌐 CDN Configuration

### Cloudflare Settings

```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Cache static assets aggressively
  if (url.pathname.match(/\.(js|css|wasm|png|jpg|jpeg|gif|svg|ico)$/)) {
    const response = await fetch(request);
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  
  // HTML files - shorter cache
  if (url.pathname.match(/\.html$/) || url.pathname === '/') {
    const response = await fetch(request);
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    headers.set('Content-Security-Policy', `
      default-src 'self';
      script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      font-src 'self' data:;
      connect-src 'self' https://api.landvisualizer.com https://sentry.io;
      worker-src 'self' blob:;
    `.replace(/\s+/g, ' ').trim());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  
  return fetch(request);
}
```

### Cache Strategy

| Resource Type | Cache Duration | Cache Control |
|--------------|---------------|---------------|
| HTML | 1 hour | `max-age=3600` |
| JS/CSS (hashed) | 1 year | `max-age=31536000, immutable` |
| WASM modules | 1 week | `max-age=604800` |
| Images | 1 month | `max-age=2592000` |
| API responses | No cache | `no-cache, no-store` |

---

## 🐳 Docker Configuration

### Dockerfile

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ emscripten

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build WASM modules
RUN npm run wasm:compile && npm run wasm:optimize

# Build application
RUN npm run build:prod

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public/wasm /usr/share/nginx/html/wasm

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - landviz
    
  monitoring:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - landviz

networks:
  landviz:
    driver: bridge
```

---

## 📊 Monitoring & Logging

### Application Monitoring

```typescript
// src/monitoring/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initMonitoring() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
      ],
      tracesSampleRate: 0.1,
      environment: import.meta.env.VITE_APP_ENV,
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        return event;
      }
    });
  }
}

// Performance monitoring
export function trackPerformance(metric: string, value: number) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metric,
      value: Math.round(value)
    });
  }
  
  // Send to Sentry
  const transaction = Sentry.getCurrentHub()
    .getScope()
    ?.getTransaction();
  
  if (transaction) {
    transaction.setMeasurement(metric, value, 'millisecond');
  }
}
```

### Health Checks

```typescript
// src/health/healthcheck.ts
export async function performHealthCheck(): Promise<HealthStatus> {
  const checks = {
    app: true,
    wasm: false,
    cdn: false,
    precision: false
  };
  
  try {
    // Check WASM availability
    const wasmTest = await fetch('/wasm/geometry.wasm', { method: 'HEAD' });
    checks.wasm = wasmTest.ok;
    
    // Check CDN
    const cdnTest = await fetch(`${import.meta.env.VITE_CDN_URL}/health`, { 
      method: 'GET',
      mode: 'no-cors'
    });
    checks.cdn = true; // no-cors always succeeds if request completes
    
    // Check precision mode
    const precision = new PrecisionCalculator();
    checks.precision = await precision.isPrecisionAvailable();
    
    return {
      status: Object.values(checks).every(v => v) ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks,
      error: error.message,
      timestamp: new Date()
    };
  }
}
```

---

## 🚦 Deployment Checklist

### Pre-Deployment

```markdown
## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] ESLint passing
- [ ] TypeScript compiles without errors
- [ ] Bundle size under 5MB

### Security
- [ ] Dependencies updated
- [ ] Security audit passing
- [ ] CSP headers configured
- [ ] Sensitive data removed from code

### Performance
- [ ] Lighthouse score > 90
- [ ] FPS >= 60 on desktop
- [ ] FPS >= 30 on mobile
- [ ] Load time < 3s on 3G

### Features
- [ ] All features tested on staging
- [ ] Mobile experience validated
- [ ] Cross-browser testing complete
- [ ] Accessibility audit passing

### Documentation
- [ ] CHANGELOG.md updated
- [ ] API documentation current
- [ ] README.md accurate
```

### Post-Deployment

```markdown
## Post-Deployment Verification

### Immediate (0-5 minutes)
- [ ] Site accessible
- [ ] No console errors
- [ ] Core features working
- [ ] WASM modules loading

### Short-term (5-30 minutes)
- [ ] Analytics tracking
- [ ] Error monitoring active
- [ ] Performance metrics normal
- [ ] CDN cache working

### Extended (30+ minutes)
- [ ] No error spike in Sentry
- [ ] User reports checked
- [ ] Performance degradation monitored
- [ ] Rollback plan ready if needed
```

---

## 🔄 Rollback Procedure

### Automatic Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

CURRENT_VERSION=$(curl -s https://landvisualizer.com/version.json | jq -r '.version')
PREVIOUS_VERSION=$(git tag | tail -2 | head -1)

echo "Rolling back from $CURRENT_VERSION to $PREVIOUS_VERSION"

# Trigger rollback deployment
git checkout $PREVIOUS_VERSION
npm run deploy:prod:emergency

# Verify rollback
sleep 30
NEW_VERSION=$(curl -s https://landvisualizer.com/version.json | jq -r '.version')

if [ "$NEW_VERSION" == "$PREVIOUS_VERSION" ]; then
  echo "✅ Rollback successful"
  # Notify team
  curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"🔄 Rolled back to $PREVIOUS_VERSION\"}"
else
  echo "❌ Rollback failed"
  exit 1
fi
```

### Manual Rollback Steps

1. **Identify last stable version**
   ```bash
   git tag | tail -5
   ```

2. **Checkout stable version**
   ```bash
   git checkout v1.2.3
   ```

3. **Emergency deploy**
   ```bash
   npm run deploy:prod:emergency --skip-tests
   ```

4. **Verify deployment**
   ```bash
   curl https://landvisualizer.com/health
   ```

5. **Clear CDN cache**
   ```bash
   npm run cdn:purge
   ```

---

## 📈 Performance Budgets

### Lighthouse Configuration

```json
// .github/lighthouse-budget.json
{
  "path": "/*",
  "resourceSizes": [
    {
      "resourceType": "script",
      "budget": 300
    },
    {
      "resourceType": "image",
      "budget": 200
    },
    {
      "resourceType": "total",
      "budget": 1000
    }
  ],
  "resourceCounts": [
    {
      "resourceType": "third-party",
      "budget": 5
    }
  ],
  "timings": [
    {
      "metric": "interactive",
      "budget": 3000
    },
    {
      "metric": "first-contentful-paint",
      "budget": 1000
    }
  ]
}
```

---

## 🔐 Security Headers

### Production Headers

```nginx
# nginx.conf security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;

# Strict CSP for production
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.landvisualizer.com https://sentry.io;
  worker-src 'self' blob:;
  frame-ancestors 'none';
" always;
```

---

## 🛠️ Troubleshooting

### Common Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Build fails** | Dependencies outdated | `rm -rf node_modules package-lock.json && npm install` |
| **WASM not loading** | Wrong MIME type | Add `application/wasm` to server config |
| **White screen** | JS error in production | Check Sentry, enable source maps |
| **Slow load** | Large bundle | Enable code splitting, lazy load |
| **404 on refresh** | SPA routing | Configure server for HTML5 history |
| **CORS errors** | CDN misconfiguration | Update CORS headers in CDN |

### Debug Mode

```typescript
// Enable debug mode in production (temporary)
localStorage.setItem('DEBUG_MODE', 'true');
window.location.reload();

// View debug information
console.log(window.__DEBUG_INFO__);

// Disable debug mode
localStorage.removeItem('DEBUG_MODE');
```

---

## 📝 Deployment Scripts

### Utility Scripts

```json
// package.json additional scripts
{
  "scripts": {
    "deploy:check": "node scripts/pre-deploy-check.js",
    "deploy:staging": "npm run build:staging && npm run upload:staging",
    "deploy:prod": "npm run deploy:check && npm run build:prod && npm run upload:prod",
    "deploy:emergency": "npm run build:prod --skip-tests && npm run upload:prod --force",
    "upload:staging": "netlify deploy --dir=dist --site=$NETLIFY_STAGING_ID",
    "upload:prod": "netlify deploy --dir=dist --site=$NETLIFY_PROD_ID --prod",
    "cdn:purge": "node scripts/purge-cdn.js",
    "rollback": "bash scripts/rollback.sh",
    "health:check": "node scripts/health-check.js"
  }
}
```

---

## 📊 Deployment Metrics

### Key Metrics to Track

- **Deployment Frequency**: Target 2-3 per week
- **Lead Time**: < 2 hours from commit to production
- **Rollback Rate**: < 5% of deployments
- **Mean Time to Recovery**: < 15 minutes
- **Deployment Success Rate**: > 95%

---

*This deployment guide ensures reliable, secure, and performant deployments of Land Visualizer across all environments. Follow the checklist and monitoring procedures for successful releases.*