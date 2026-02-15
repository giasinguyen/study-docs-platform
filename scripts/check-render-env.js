/**
 * Validate environment variables for Render deployment
 * Run: node scripts/check-render-env.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Required environment variables
const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
];

// Optional but recommended
const OPTIONAL_VARS = [
  'GEMINI_API_KEY',
  'CORS_ORIGINS',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_REFRESH_TOKEN',
  'GOOGLE_DRIVE_FOLDER_ID',
];

const envVars = {};
let currentIndex = 0;

console.log('\n🔍 Render Environment Variables Checker\n');
console.log('This tool helps you validate your environment variables before deploying.\n');
console.log('Press Enter to skip optional variables.\n');
console.log('━'.repeat(60));

function askVariable(varName, isRequired = true) {
  const prompt = isRequired 
    ? `\n✅ [Required] ${varName}: `
    : `\n🔸 [Optional] ${varName} (press Enter to skip): `;

  rl.question(prompt, (value) => {
    if (value.trim()) {
      envVars[varName] = value.trim();
    } else if (isRequired) {
      console.log('❌ This variable is required! Please enter a value.');
      return askVariable(varName, isRequired);
    }

    // Move to next variable
    if (currentIndex < REQUIRED_VARS.length - 1) {
      currentIndex++;
      askVariable(REQUIRED_VARS[currentIndex], true);
    } else if (currentIndex === REQUIRED_VARS.length - 1) {
      // Move to optional vars
      currentIndex = 0;
      console.log('\n' + '━'.repeat(60));
      console.log('\nOptional Variables (for additional features):\n');
      askVariable(OPTIONAL_VARS[currentIndex], false);
    } else if (currentIndex < OPTIONAL_VARS.length - 1) {
      currentIndex++;
      askVariable(OPTIONAL_VARS[currentIndex], false);
    } else {
      // Done
      showResults();
    }
  });
}

function showResults() {
  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 VALIDATION RESULTS\n');

  // Check required vars
  let allRequiredPresent = true;
  console.log('Required Variables:');
  REQUIRED_VARS.forEach((varName) => {
    const present = !!envVars[varName];
    const status = present ? '✅' : '❌';
    console.log(`  ${status} ${varName}`);
    if (!present) allRequiredPresent = false;
  });

  // Check optional vars
  console.log('\nOptional Variables:');
  OPTIONAL_VARS.forEach((varName) => {
    const present = !!envVars[varName];
    const status = present ? '✅' : '⚪';
    console.log(`  ${status} ${varName}`);
  });

  console.log('\n' + '━'.repeat(60));

  // Final verdict
  if (!allRequiredPresent) {
    console.log('\n❌ VALIDATION FAILED\n');
    console.log('Missing required variables. Please configure them before deploying.');
    console.log('See RENDER_SETUP_ENV.md for instructions.\n');
  } else {
    console.log('\n✅ VALIDATION PASSED\n');
    console.log('All required variables are present!');
    
    const optionalCount = OPTIONAL_VARS.filter(v => envVars[v]).length;
    if (optionalCount === 0) {
      console.log('\n⚠️  No optional variables configured.');
      console.log('   - AI features will be disabled (no GEMINI_API_KEY)');
      console.log('   - Google Drive upload disabled (no OAuth config)');
      console.log('   - CORS might need adjustment (no CORS_ORIGINS)');
    } else {
      console.log(`\n✨ ${optionalCount}/${OPTIONAL_VARS.length} optional features configured`);
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Copy these values to Render Dashboard → Environment tab');
    console.log('   2. Save changes and deploy');
    console.log('   3. See RENDER_DEPLOY.md for full instructions\n');
  }

  // Validation specifics
  console.log('━'.repeat(60));
  console.log('\n🔎 Variable Validation:\n');

  // DATABASE_URL format check
  if (envVars.DATABASE_URL) {
    const isPooler = envVars.DATABASE_URL.includes('pooler.supabase.com');
    const hasPort6543 = envVars.DATABASE_URL.includes(':6543');
    if (isPooler && hasPort6543) {
      console.log('✅ DATABASE_URL: Using Supabase pooler (Transaction mode, port 6543)');
    } else if (isPooler) {
      console.log('⚠️  DATABASE_URL: Using pooler but not port 6543. Recommended: 6543');
    } else {
      console.log('⚠️  DATABASE_URL: Not using Supabase pooler. May have connection issues.');
    }
  }

  // Check for placeholder values
  const hasPlaceholder = Object.entries(envVars).some(([key, value]) => {
    return value.includes('[YOUR-') || 
           value.includes('your-') || 
           value.includes('xxx') ||
           value === 'production' && key !== 'NODE_ENV' ||
           value === '10000' && key !== 'PORT';
  });

  if (hasPlaceholder) {
    console.log('⚠️  Some values look like placeholders. Please replace them with real values.');
  }

  // JWT Secret length check
  if (envVars.SUPABASE_JWT_SECRET && envVars.SUPABASE_JWT_SECRET.length < 32) {
    console.log('⚠️  SUPABASE_JWT_SECRET seems too short (< 32 chars). Double-check it.');
  }

  console.log('\n' + '━'.repeat(60) + '\n');

  rl.close();
}

// Start
askVariable(REQUIRED_VARS[0], true);
