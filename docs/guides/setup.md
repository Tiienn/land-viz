# Land Visualizer Setup Guide
**Complete Setup Instructions for Development, Testing, and Production**  
*Version 1.0 | Last Updated: November 2025*

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Development Setup](#development-setup)
4. [Chili3D & WebAssembly Setup](#chili3d--webassembly-setup)
5. [Database Setup](#database-setup)
6. [Testing Environment](#testing-environment)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Platform-Specific Instructions](#platform-specific-instructions)

---

## 🚀 Quick Start

### Fastest Path to Development (5 minutes)

```bash
# Clone and setup
git clone https://github.com/landvisualizer/land-visualizer.git
cd land-visualizer
npm install
npm run dev

# Open http://localhost:3000
```

That's it for basic development! For full features including Chili3D integration, continue reading.

---

## ✅ Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Check Version |
|----------|----------------|-------------|---------------|
| **Node.js** | 18.0.0 | 20.x LTS | `node --version` |
| **npm** | 9.0.0 | 10.x | `npm --version` |
| **Git** | 2.30.0 | Latest | `git --version` |

### Optional but Recommended

| Software | Purpose | Installation |
|----------|---------|--------------|
| **VS Code** | IDE | [Download](https://code.visualstudio.com/) |
| **Chrome** | Development & debugging | [Download](https://www.google.com/chrome/) |
| **Docker** | Container development | [Download](https://www.docker.com/) |
| **Emscripten** | WASM compilation | See [WASM Setup](#webassembly-setup) |

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended for WASM compilation)
- **Storage**: 5GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **GPU**: WebGL 2.0 support required

---

## 💻 Development Setup

### Step 1: Clone Repository

```bash
# HTTPS (recommended for most users)
git clone https://github.com/landvisualizer/land-visualizer.git

# SSH (if you have SSH keys configured)
git clone git@github.com:landvisualizer/land-visualizer.git

# Enter project directory
cd land-visualizer
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter issues, try:
npm ci  # Clean install from package-lock.json

# For contributing developers
npm install --include=dev
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# For Windows
copy .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Development Environment Variables
NODE_ENV=development
PORT=3000

# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_CDN_URL=http://localhost:3000

# Features (Development)
VITE_ENABLE_PRECISION=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
VITE_ENABLE_DEV_TOOLS=true

# WebAssembly
VITE_WASM_PATH=/wasm/
VITE_WASM_MEMORY_LIMIT=512

# Optional Services
VITE_SENTRY_DSN=  # Leave empty for development
VITE_MAPBOX_TOKEN=  # Optional for satellite imagery
```

### Step 4: Verify Installation

```bash
# Run verification script
npm run verify:setup

# Or manually check:
npm run test:setup
```

Expected output:
```
✅ Node.js version OK (20.x.x)
✅ npm version OK (10.x.x)
✅ Dependencies installed
✅ Environment configured
✅ WebGL support detected
✅ Ready for development!
```

### Step 5: Start Development Server

```bash
# Start development server
npm run dev

# With specific options
npm run dev -- --port 3001  # Different port
npm run dev -- --host  # Expose to network
```

Open http://localhost:3000 in your browser.

### Step 6: VS Code Setup

Install recommended extensions:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens",
    "yoavbls.pretty-ts-errors",
    "github.copilot"
  ]
}
```

Configure VS Code settings:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## 🎯 Chili3D & WebAssembly Setup

### Prerequisites for WASM Development

```bash
# Check if you have Python (required for Emscripten)
python --version  # or python3 --version

# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh  # On Windows: emsdk_env.bat

# Verify Emscripten
emcc -v
```

### Step 1: Install Chili3D Dependencies

```bash
# Install Chili3D packages
npm install @chili3d/core @chili3d/geometry @chili3d/io

# Install WASM build tools
npm install --save-dev \
  assemblyscript \
  wasm-opt \
  wasm-pack
```

### Step 2: Build WASM Modules

```bash
# Setup WASM build environment
npm run wasm:setup

# Compile C++ to WASM
npm run wasm:compile

# Optimize WASM modules
npm run wasm:optimize

# Or run all steps
npm run wasm:build
```

### Step 3: Configure WASM Build

Create `wasm.config.js`:

```javascript
// wasm.config.js
module.exports = {
  input: {
    geometry: 'src/wasm/geometry.cpp',
    calculations: 'src/wasm/calculations.cpp',
    boolean: 'src/wasm/boolean_ops.cpp'
  },
  output: {
    directory: 'public/wasm',
    optimize: true
  },
  emscripten: {
    EXPORTED_FUNCTIONS: [
      '_calculateArea',
      '_validatePolygon',
      '_subdivide',
      '_calculateSetback',
      '_triangulate'
    ],
    EXPORTED_RUNTIME_METHODS: [
      'ccall',
      'cwrap',
      'allocate',
      'intArrayFromString'
    ],
    ALLOW_MEMORY_GROWTH: 1,
    MAXIMUM_MEMORY: '512MB',
    OPTIMIZATION: '-O3',
    SIMD: true
  }
};
```

### Step 4: Test WASM Integration

```bash
# Run WASM tests
npm run test:wasm

# Check WASM performance
npm run benchmark:wasm
```

---

## 🗄️ Database Setup

### Local Development (Optional)

Land Visualizer primarily runs client-side, but for features like user accounts:

```bash
# Using Docker
docker-compose up -d postgres

# Or install PostgreSQL locally
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt-get install postgresql
sudo systemctl start postgresql

# Windows - Download installer from postgresql.org
```

### Database Configuration

```sql
-- Create database
CREATE DATABASE landvisualizer_dev;

-- Create user
CREATE USER landviz_dev WITH PASSWORD 'development_password';
GRANT ALL PRIVILEGES ON DATABASE landvisualizer_dev TO landviz_dev;

-- Run migrations (if applicable)
npm run db:migrate
```

### Redis Setup (Optional, for sessions)

```bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## 🧪 Testing Environment

### Setup Testing Environment

```bash
# Install test dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  cypress \
  playwright

# Configure test environment
npm run test:setup
```

### Running Tests

```bash
# Unit tests
npm test
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
npm run test:e2e:headless  # CI mode

# All tests
npm run test:all
```

### Cypress Setup

```bash
# Install Cypress
npx cypress install

# Open Cypress GUI
npx cypress open

# Run Cypress tests
npx cypress run
```

### Test Database Setup

```bash
# Create test database
createdb landvisualizer_test

# Configure test environment
cp .env.test.example .env.test

# Run tests with test database
NODE_ENV=test npm test
```

---

## 🚀 Production Deployment

### Build for Production

```bash
# Install production dependencies only
npm ci --production

# Build application
npm run build

# Build with analysis
npm run build:analyze

# Preview production build
npm run preview
```

### Docker Deployment

```dockerfile
# Dockerfile is included in the project
docker build -t landvisualizer:latest .
docker run -p 80:80 landvisualizer:latest
```

### Environment Variables (Production)

```bash
# .env.production
NODE_ENV=production
VITE_API_URL=https://api.landvisualizer.com
VITE_CDN_URL=https://cdn.landvisualizer.com
VITE_ENABLE_PRECISION=true
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_WASM_PATH=/wasm/
```

### Deployment Platforms

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

#### AWS S3 + CloudFront

```bash
# Build application
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Node/npm Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use different npm registry
npm config set registry https://registry.npmjs.org/
```

#### WASM Compilation Issues

```bash
# Check Emscripten installation
emcc -v

# Rebuild WASM with verbose output
npm run wasm:build -- --verbose

# Clear WASM cache
rm -rf public/wasm/*.wasm
npm run wasm:build
```

#### Port Already in Use

```bash
# Find process using port 3000
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3001
```

#### WebGL Not Supported

```javascript
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
if (!gl) {
  console.error('WebGL not supported');
}
```

#### Memory Issues During Build

```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Windows
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

---

## 🖥️ Platform-Specific Instructions

### Windows Setup

```powershell
# Install Windows Build Tools
npm install --global windows-build-tools

# If using WSL2
wsl --install
wsl --set-default-version 2

# Install in WSL
sudo apt-get update
sudo apt-get install build-essential
```

### macOS Setup

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node git python3
```

### Linux Setup

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  curl \
  git \
  python3 \
  python3-pip

# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora/RHEL
sudo dnf install -y \
  gcc-c++ \
  make \
  git \
  nodejs \
  npm
```

### Docker Development

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    command: npm run dev
```

Run with Docker:
```bash
docker-compose -f docker-compose.dev.yml up
```

---

## 📚 Additional Resources

### Setup Scripts

The project includes helpful setup scripts:

```bash
# Run complete setup
./scripts/setup.sh  # macOS/Linux
scripts\setup.bat   # Windows

# Individual setup tasks
npm run setup:deps      # Install dependencies
npm run setup:env       # Configure environment
npm run setup:wasm      # Setup WASM
npm run setup:db        # Setup database
npm run setup:test      # Setup testing
```

### Health Check

```bash
# Run comprehensive health check
npm run health:check

# Individual checks
npm run check:node      # Node.js version
npm run check:deps      # Dependencies
npm run check:env       # Environment
npm run check:wasm      # WASM modules
npm run check:webgl     # WebGL support
```

### Development Tools

```bash
# Start all development tools
npm run dev:all

# Individual tools
npm run dev:server     # Development server
npm run dev:wasm       # WASM watcher
npm run dev:tests      # Test watcher
npm run dev:docs       # Documentation server
```

---

## 🆘 Getting Help

### Resources
- **Documentation**: [/docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/landvisualizer/land-visualizer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/landvisualizer/land-visualizer/discussions)
- **Discord**: [Join our Discord](https://discord.gg/landviz)
- **Email**: dev@landvisualizer.com

### Quick Fixes

```bash
# Reset everything and start fresh
git clean -fdx  # Warning: removes all untracked files
npm install
npm run dev

# Update to latest version
git pull origin main
npm install
npm run dev
```

---

## ✅ Setup Checklist

Use this checklist to ensure complete setup:

### Basic Development
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment configured (`.env.local`)
- [ ] Development server running
- [ ] Can access http://localhost:3000

### Advanced Features
- [ ] Chili3D packages installed
- [ ] Emscripten installed (for WASM)
- [ ] WASM modules compiled
- [ ] Precision mode working
- [ ] CAD export functional

### Testing
- [ ] Test dependencies installed
- [ ] Unit tests passing
- [ ] E2E tests configured
- [ ] Can run test suite

### Production Ready
- [ ] Production build successful
- [ ] Bundle size acceptable
- [ ] Performance benchmarks met
- [ ] Deployment platform chosen
- [ ] Environment variables configured

---

**Congratulations! You're ready to develop Land Visualizer! 🎉**

For next steps, check out:
- [Developer Guide](./developer-guide.md) - Complete development documentation
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Architecture Overview](./ARCHITECTURE.md) - System design

**Happy coding!** 🚀