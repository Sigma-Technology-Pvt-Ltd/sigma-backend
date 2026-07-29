import fs from 'fs';

const seqTables = [
    'associations', 'association_categories', 'banners', 'blogs', 'blog_categories',
    'brands', 'candidates', 'catalogues', 'categories', 'concerns', 'contact_forms',
    'download_files', 'faqs', 'faq_types', 'images', 'job_lists', 'pages', 'permissions',
    'plugins', 'products', 'product_enquiries', 'product_reviews', 'roles', 'shops',
    'subscribers', 'testimonials', 'failed_jobs', 'users'
];

const truncateStmt = `TRUNCATE TABLE ${seqTables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;\n\n`;

const pgInsertContent = fs.readFileSync('pg_insert.sql', 'utf8');

fs.writeFileSync('full_reset_and_import.sql', truncateStmt + pgInsertContent);
console.log('Created full_reset_and_import.sql');
