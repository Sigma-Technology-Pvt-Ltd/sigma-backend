/**
 * Migration Script: Upload existing local images to Supabase Storage
 * 
 * Run: node scripts/migrateImagesToSupabase.js
 * 
 * What it does:
 * - Reads all images from public/frontend/images/ subfolders
 * - Uploads each to Supabase bucket maintaining folder structure
 * - Skips files already uploaded (safe to re-run)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'sigma-media';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Folder mapping: local folder name → Supabase folder name
const FOLDER_MAP = {
    'banners':       'banners',
    'blogs':         'blogs',
    'blog_categories': 'blog_categories',
    'careers':       'careers',
    'categories':    'categories',
    'products':      'products',
    'testimonials':  'testimonials',
    'associations':  'associations',
    'brands':        'brands',
    'catalogues':    'documents',
    'concerns':      'concerns',
};

const LOCAL_IMAGES_PATH = path.join(__dirname, '../public/frontend/images');

async function migrateFolder(localFolder, supabaseFolder) {
    const folderPath = path.join(LOCAL_IMAGES_PATH, localFolder);

    if (!fs.existsSync(folderPath)) {
        console.log(`  ⏭️  Skipping ${localFolder} (folder not found locally)`);
        return { uploaded: 0, skipped: 0, errors: 0 };
    }

    const files = fs.readdirSync(folderPath).filter(f => {
        const filePath = path.join(folderPath, f);
        // Skip subdirectories
        if (!fs.statSync(filePath).isFile()) return false;
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf'].includes(ext);
    });

    if (files.length === 0) {
        console.log(`  ⏭️  ${localFolder}/ — 0 files`);
        return { uploaded: 0, skipped: 0, errors: 0 };
    }

    // Get list of already uploaded files in this folder
    const { data: existingFiles } = await supabase.storage
        .from(bucketName)
        .list(supabaseFolder, { limit: 10000 });

    const existingNames = new Set((existingFiles || []).map(f => f.name));

    let uploaded = 0, skipped = 0, errors = 0;

    for (const file of files) {
        if (existingNames.has(file)) {
            skipped++;
            continue;
        }

        const filePath = path.join(folderPath, file);
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(file).toLowerCase();
        const contentType = ext === '.pdf' ? 'application/pdf'
            : ext === '.svg' ? 'image/svg+xml'
            : `image/${ext.slice(1)}`;

        const { error } = await supabase.storage
            .from(bucketName)
            .upload(`${supabaseFolder}/${file}`, fileBuffer, {
                contentType,
                upsert: false,
            });

        if (error) {
            console.error(`    ❌ Failed: ${file} — ${error.message}`);
            errors++;
        } else {
            uploaded++;
        }
    }

    return { uploaded, skipped, errors };
}

async function main() {
    console.log('\n🚀 Starting image migration to Supabase Storage...');
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`📁 Local path: ${LOCAL_IMAGES_PATH}\n`);

    let totalUploaded = 0, totalSkipped = 0, totalErrors = 0;

    for (const [localFolder, supabaseFolder] of Object.entries(FOLDER_MAP)) {
        process.stdout.write(`📂 ${localFolder}/ → ${supabaseFolder}/... `);
        const { uploaded, skipped, errors } = await migrateFolder(localFolder, supabaseFolder);
        console.log(`✅ ${uploaded} uploaded, ⏭️ ${skipped} skipped, ❌ ${errors} errors`);
        totalUploaded += uploaded;
        totalSkipped += skipped;
        totalErrors += errors;
    }

    console.log('\n========================================');
    console.log(`✅ Total uploaded: ${totalUploaded}`);
    console.log(`⏭️  Total skipped (already exist): ${totalSkipped}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log('========================================\n');

    if (totalErrors === 0) {
        console.log('🎉 Migration complete! All images are now in Supabase Storage.');
    } else {
        console.log('⚠️  Migration done with some errors. Re-run to retry failed files.');
    }
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
