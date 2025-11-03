# OpenCV & Tesseract CSP Configuration Fix

## Problem Summary

The site plan import feature requires two WASM-based libraries:
1. **OpenCV.js** - Computer vision for shape detection
2. **Tesseract.js** - OCR for dimension text recognition

Both were failing due to Content Security Policy (CSP) restrictions.

## Root Causes & Solutions

### Issue 1: OpenCV WASM Initialization ✅ FIXED
**Error:** `Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source`

**Cause:** OpenCV.js requires both `'unsafe-eval'` (for dynamic functions) and `'wasm-unsafe-eval'` (for WebAssembly compilation)

**Solution:** Added both directives to CSP `script-src`

### Issue 2: OpenCV Module Loading ✅ FIXED
**Error:** `window.cv` was never populated, timeout after 60 seconds

**Cause:** `@techstark/opencv-js` exports a Promise, not the cv object directly

**Solution:** Modified `opencvSetup.ts` to:
1. Import the package
2. Await the promise
3. Assign resolved value to `window.cv`

```typescript
import('@techstark/opencv-js')
  .then((module) => {
    const cvLoader = module.default || module;
    if (cvLoader && typeof cvLoader.then === 'function') {
      cvLoader.then((cv) => {
        window.cv = cv;
        // Continue initialization...
      });
    }
  });
```

### Issue 3: Tesseract Web Workers ✅ FIXED
**Error:** `Refused to create a worker from 'blob:...'`

**Cause:** CSP didn't allow Web Workers from blob URLs

**Solution:** Added `worker-src 'self' blob:` to CSP

### Issue 4: Tesseract CDN Scripts ✅ FIXED
**Error:** `Refused to load the script 'https://cdn.jsdelivr.net/npm/tesseract.js@v6.0.1/dist/worker.min.js'`

**Cause:** Tesseract.js loads worker scripts from CDN, which wasn't allowed

**Solution:** Added CDN domains to CSP:
- `script-src`: Added `https://cdn.jsdelivr.net` and `https://unpkg.com`
- `connect-src`: Added CDN domains plus `https://tessdata.projectnaptha.com`

## Final CSP Configuration

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com https://raw.githubusercontent.com https://raw.githack.com https://fonts.googleapis.com https://fonts.gstatic.com;">
```

## Security Considerations

### Current Status (Development)
✅ **Functional** - Both libraries work correctly
⚠️ **Security** - Allows external CDN scripts (necessary for now)

### Production Improvements (Recommended)

For enhanced security in production, consider:

1. **Local Worker Files**
   - Copy Tesseract worker scripts to `/public/`
   - Configure `workerPath` to use local files
   - Remove CDN from CSP

2. **Language Data Caching**
   - Pre-download Tesseract language files
   - Serve from local `/public/tessdata/`
   - Removes dependency on tessdata.projectnaptha.com

3. **Subresource Integrity (SRI)**
   - If keeping CDN, add SRI hashes
   - Ensures scripts haven't been tampered with

Example for production:
```typescript
const worker = await createWorker('eng+fra', 1, {
  workerPath: '/tesseract-worker.min.js',
  corePath: '/tesseract-core.wasm.js',
  langPath: '/tessdata'
});
```

## Testing Checklist

✅ OpenCV.js loads without CSP errors
✅ `window.cv` is populated with OpenCV object
✅ Tesseract worker initializes successfully
✅ Language data downloads (eng + fra)
✅ No console errors during initialization
🔄 Import feature completes end-to-end (testing in progress)

## Console Output (Expected)

```
[OpenCV] Loading opencv.js from package...
[OpenCV] Package loaded, analyzing module structure...
[OpenCV] Module is a promise, awaiting...
[OpenCV] Promise resolved, assigning to window.cv...
[OpenCV] WASM initialized successfully
[OpenCV] Initialization complete

[Tesseract] Creating worker for languages: eng+fra
[Tesseract] Loading language data: 100%
[Tesseract] Worker created, configuring parameters...
[Tesseract] Parameters configured
```

## Files Modified

1. **`app/index.html`** - CSP configuration (lines 14)
2. **`app/src/services/imageProcessing/opencvSetup.ts`** - OpenCV module loading logic (lines 138-194)

## Performance Expectations

- **OpenCV initialization:** 1-3 seconds (WASM compilation)
- **Tesseract initialization:** 3-8 seconds (worker + language data download)
- **Total startup time:** ~10 seconds first time, ~2 seconds cached

## Troubleshooting

### If OpenCV still fails:
1. Check browser supports WebAssembly (Chrome 57+, Firefox 52+, Safari 11+)
2. Clear cache: `rm -rf node_modules/.vite && npm run dev`
3. Verify package installed: `npm list @techstark/opencv-js`

### If Tesseract still fails:
1. Check internet connection (needs to download language data)
2. Try different browser
3. Check browser console for specific CDN errors

## References

- OpenCV.js: https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html
- Tesseract.js: https://tesseract.projectnaptha.com/
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- @techstark/opencv-js: https://www.npmjs.com/package/@techstark/opencv-js

---

**Status:** ✅ CSP configured, both libraries loading
**Next Steps:** Test complete site plan import workflow
**Updated:** January 2025
