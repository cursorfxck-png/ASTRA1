const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'astra-bucket';

async function uploadFile(filePath, supabasePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    console.log(`Uploading ${fileName} to ${supabasePath}...`);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(supabasePath, fileBuffer, {
        contentType: getContentType(fileName),
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error.message);
      return false;
    }

    console.log(`✓ Successfully uploaded ${fileName}`);
    return true;
  } catch (error) {
    console.error(`Error reading/uploading ${filePath}:`, error.message);
    return false;
  }
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes = {
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadDirectory(localDir, supabaseDir = '') {
  if (!fs.existsSync(localDir)) {
    console.log(`Directory ${localDir} does not exist, skipping...`);
    return;
  }

  const files = fs.readdirSync(localDir);

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      await uploadDirectory(localPath, path.join(supabaseDir, file));
    } else {
      const supabasePath = path.join(supabaseDir, file).replace(/\\/g, '/');
      await uploadFile(localPath, supabasePath);
    }
  }
}

async function seedLandingPage() {
  const contentJsonPath = path.join(__dirname, '../src/data/site-content.json');
  if (!fs.existsSync(contentJsonPath)) {
    console.log('No site-content.json found, skipping landing page seed');
    return;
  }

  const content = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));
  console.log('\nSeeding landing_page table from site-content.json...');

  const { error } = await supabase
    .from('landing_page')
    .upsert({ slug: 'main', content }, { onConflict: 'slug' });

  if (error) {
    console.error('Failed to seed landing_page:', error.message);
    console.log('Make sure you ran scripts/create-landing-page-table.sql first');
  } else {
    console.log('✓ landing_page table seeded successfully');
  }
}

async function main() {
  console.log('Starting Supabase upload...\n');

  await seedLandingPage();

  console.log('\nUploading files from public/uploads...');
  await uploadDirectory(path.join(__dirname, '../public/uploads'), 'uploads');

  console.log('\n✅ Upload complete!');
  console.log('\nNext steps:');
  console.log('1. Verify landing_page row in Supabase Table Editor');
  console.log('2. Run scripts/create-bucket.sql if uploads fail');
  console.log('3. Run: npm run dev');
}

main().catch(console.error);
