import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        
        console.log('Reading create_users_table.sql...');
        const createSql = fs.readFileSync('create_users_table.sql', 'utf8');
        
        console.log('Executing create_users_table.sql...');
        await client.query(createSql);
        console.log('Users table created successfully.');
        
        console.log('Reading full_reset_and_import.sql...');
        const importSql = fs.readFileSync('full_reset_and_import.sql', 'utf8');
        
        console.log('Executing full_reset_and_import.sql...');
        await client.query(importSql);
        console.log('Full reset and import completed successfully.');
        
        // Print counts
        console.log('\n--- Table Counts ---');
        const seqTables = [
            'associations', 'association_categories', 'banners', 'blogs', 'blog_categories',
            'brands', 'candidates', 'catalogues', 'categories', 'concerns', 'contact_forms',
            'download_files', 'faqs', 'faq_types', 'images', 'job_lists', 'pages', 'permissions',
            'plugins', 'products', 'product_enquiries', 'product_reviews', 'roles', 'shops',
            'subscribers', 'testimonials', 'failed_jobs', 'users'
        ];
        
        for (const table of seqTables) {
            const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
            console.log(`${table}: ${res.rows[0].count}`);
        }
        
    } catch (err) {
        console.error('ERROR during execution:', err);
    } finally {
        await client.end();
    }
}

main();
