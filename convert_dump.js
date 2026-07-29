import fs from 'fs';
import readline from 'readline';

async function main() {
    const rl = readline.createInterface({
        input: fs.createReadStream('../sigmatechnologie_admin.sql'),
        crlfDelay: Infinity
    });
    
    const out = fs.createWriteStream('./pg_insert.sql');
    let inInsert = false;
    let insertCount = 0;
    
    const validTables = [
        'associations', 'association_categories', 'banners', 'brands', 'faqs', 'faq_types',
        'plugins', 'pages', 'concerns', 'testimonials', 'blogs', 'blog_categories',
        'candidates', 'catalogues', 'categories', 'contact_forms', 'download_files',
        'failed_jobs', 'images', 'job_lists', 'permissions', 'products', 'product_enquiries',
        'product_reviews', 'roles', 'shops', 'subscribers', 'users', 'migrations',
        'model_has_roles', 'model_has_permissions', 'role_has_permissions', 'password_resets'
    ];
    
    out.write('-- Converted PostgreSQL Insert Script\n');
    
    for await (const line of rl) {
        if (line.startsWith('INSERT INTO')) {
            const match = line.match(/INSERT INTO `([^`]+)`/);
            if (match && validTables.includes(match[1])) {
                inInsert = true;
                insertCount++;
            } else {
                inInsert = false;
            }
        }
        
        if (inInsert) {
            let pgLine = line.replace(/`/g, '"');
            pgLine = pgLine.replace(/\\'/g, "''");
            pgLine = pgLine.replace(/\\"/g, '"');
            
            if (pgLine.includes("'0000-00-00'") || pgLine.includes("'0000-00-00 00:00:00'")) {
                pgLine = pgLine.replace(/'0000-00-00( 00:00:00)?'/g, 'NULL');
            }
            
            out.write(pgLine + '\n');
            
            if (line.trim().endsWith(');')) {
                inInsert = false;
            }
        }
    }
    
    out.write('\n\n-- Sequence Updates\n');
    
    const seqTables = [
        'associations', 'association_categories', 'banners', 'blogs', 'blog_categories',
        'brands', 'candidates', 'catalogues', 'categories', 'concerns', 'contact_forms',
        'download_files', 'faqs', 'faq_types', 'images', 'job_lists', 'pages', 'permissions',
        'plugins', 'products', 'product_enquiries', 'product_reviews', 'roles', 'shops',
        'subscribers', 'testimonials', 'failed_jobs', 'users'
    ];
    
    for (const table of seqTables) {
        out.write(`SELECT setval('"${table}_id_seq"', COALESCE((SELECT MAX(id) FROM "${table}"), 1), (SELECT MAX(id) IS NOT NULL FROM "${table}"));\n`);
    }
    
    out.end();
    console.log(`Converted ${insertCount} INSERT statements to pg_insert.sql`);
}

main().catch(console.error);
