import fs from 'fs';
const sql = fs.readFileSync('all_tables.sql', 'utf8');
const index = sql.indexOf('CREATE TABLE "users"');
if (index !== -1) {
    const block = sql.substring(index);
    fs.writeFileSync('create_users_table.sql', block);
    console.log('Created create_users_table.sql');
} else {
    console.log('Could not find users table block');
}
