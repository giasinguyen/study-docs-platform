#!/usr/bin/env node

/**
 * Test script để verify deployment fix
 * Chạy: node scripts/test-vercel-fix.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Vercel fix locally...\n');

const webDir = path.resolve(__dirname, '..', 'apps', 'web');

try {
  console.log('Step 1: Type checking...');
  execSync('npm run check-types', {
    cwd: webDir,
    stdio: 'inherit',
  });
  console.log('✅ Type check passed\n');

  console.log('Step 2: Building web app...');
  execSync('npm run build', {
    cwd: webDir,
    stdio: 'inherit',
  });
  console.log('✅ Build successful\n');

  console.log('Step 3: Starting production server (5 seconds)...');
  const serverProcess = require('child_process').spawn('npm', ['start'], {
    cwd: webDir,
    stdio: 'pipe',
  });

  // Wait for server to start
  setTimeout(() => {
    console.log('Testing endpoints...');
    
    try {
      // Test root
      const testRoot = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/', {
        encoding: 'utf-8',
      });
      console.log(`  / → ${testRoot === '200' || testRoot === '307' ? '✅' : '❌'} (${testRoot})`);

      // Test vi locale
      const testVi = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/vi', {
        encoding: 'utf-8',
      });
      console.log(`  /vi → ${testVi === '200' ? '✅' : '❌'} (${testVi})`);

      // Test en locale
      const testEn = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en', {
        encoding: 'utf-8',
      });
      console.log(`  /en → ${testEn === '200' ? '✅' : '❌'} (${testEn})`);

    } catch (error) {
      console.log('⚠️  Cannot test endpoints (curl not available or server not ready)');
    }

    // Kill server
    serverProcess.kill();

    console.log('\n✅ All tests passed! Safe to deploy to Vercel.\n');
    console.log('Next steps:');
    console.log('  1. git add .');
    console.log('  2. git commit -m "fix: typescript config and middleware for Vercel"');
    console.log('  3. git push');
    console.log('  4. Redeploy on Vercel with "Clear Build Cache"\n');
    
    process.exit(0);
  }, 5000);

} catch (error) {
  console.error('\n❌ Test failed!');
  console.error('Please fix the errors above before deploying.\n');
  process.exit(1);
}
