#!/usr/bin/env node

/**
 * Script để test build locally giống như trên Vercel
 * Chạy: node scripts/test-build.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Testing Vercel build locally...\n');

const rootDir = path.resolve(__dirname, '..');

try {
  console.log('📦 Step 1: Installing dependencies...');
  execSync('npm install', {
    cwd: rootDir,
    stdio: 'inherit',
  });

  console.log('\n🏗️  Step 2: Building web app with Turbo...');
  execSync('npx turbo run build --filter=web', {
    cwd: rootDir,
    stdio: 'inherit',
  });

  console.log('\n✅ Build successful! Ready to deploy to Vercel 🚀');
  console.log('\n💡 Next steps:');
  console.log('   1. Commit and push your changes');
  console.log('   2. Deploy via Vercel Dashboard or CLI');
  console.log('   3. Check VERCEL_CHECKLIST.md for details\n');

  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed!');
  console.error('Please fix the errors above before deploying.\n');
  process.exit(1);
}
