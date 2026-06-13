// Check Supabase landing_page table and storage setup
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidJwt(key) {
  const parts = key.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function isValidSupabaseKey(key) {
  if (!key || key.length < 20) return false;
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_secret_')) return true;
  return isValidJwt(key);
}

console.log('\nChecking Supabase setup...\n');

console.log('1. Environment variables');
if (supabaseUrl) {
  console.log('   OK  NEXT_PUBLIC_SUPABASE_URL is set');
  console.log(`       ${supabaseUrl}`);
} else {
  console.log('   ERR NEXT_PUBLIC_SUPABASE_URL is missing');
}

if (supabaseKey) {
  if (isValidSupabaseKey(supabaseKey)) {
    const kind = supabaseKey.startsWith('sb_publishable_')
      ? 'publishable key'
      : supabaseKey.startsWith('sb_secret_')
        ? 'secret key'
        : 'JWT anon key';
    console.log(`   OK  Supabase public key looks valid (${kind})`);
  } else {
    console.log('   ERR Supabase public key looks invalid');
    console.log('       Use sb_publishable_... or full JWT from Supabase -> Project Settings -> API');
  }
} else {
  console.log('   ERR Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('   OK  Supabase admin/secret key is set');
} else {
  console.log('   WARN No SUPABASE_SECRET_KEY — CMS writes use publishable key + RLS');
}

async function checkLandingPage() {
  if (!supabaseUrl || !supabaseKey || !isValidSupabaseKey(supabaseKey)) return;

  console.log('\n2. landing_page table');
  const tableUrl = `${supabaseUrl}/rest/v1/landing_page?slug=eq.main&select=slug,version,updated_at`;

  try {
    const response = await fetch(tableUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const body = await response.text();

    if (response.ok) {
      const rows = JSON.parse(body);
      if (rows.length > 0) {
        console.log('   OK  landing_page table exists with main row');
        console.log(`       version: ${rows[0].version}, updated: ${rows[0].updated_at}`);
      } else {
        console.log('   WARN landing_page table exists but no main row');
        console.log('       Run scripts/supabase-full-setup.sql in Supabase SQL Editor');
      }
    } else if (response.status === 404 || body.includes('PGRST205') || body.includes('does not exist')) {
      console.log('   ERR landing_page table not found');
      console.log('       Run scripts/supabase-full-setup.sql in Supabase SQL Editor');
    } else {
      console.log(`   ERR ${response.status} ${response.statusText}`);
      console.log(`       ${body.slice(0, 200)}`);
    }
  } catch (error) {
    console.log('   ERR Failed to check table:', error.message);
  }

  console.log('\n3. astra-bucket storage');
  const bucketUrl = `${supabaseUrl}/storage/v1/object/public/astra-bucket/uploads`;
  try {
    const response = await fetch(bucketUrl, { method: 'HEAD' });
    if (response.ok || response.status === 400) {
      console.log('   OK  astra-bucket is accessible');
    } else {
      console.log(`   WARN Bucket check returned ${response.status}`);
      console.log('       Run scripts/supabase-full-setup.sql in Supabase SQL Editor');
    }
  } catch (error) {
    console.log('   ERR Failed to check bucket:', error.message);
  }
}

checkLandingPage().finally(() => {
  console.log('\nNext steps:');
  console.log('   1. Run scripts/supabase-full-setup.sql in Supabase SQL Editor');
  console.log('   2. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local');
  console.log('   3. Restart dev server: npm run dev\n');
});
