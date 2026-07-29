import fs from 'fs';
const schema = fs.readFileSync('./prisma/schema.prisma', 'utf8');
const tables = [];
const matches = schema.matchAll(/model\s+\w+\s*\{[\s\S]*?@@map\("([^"]+)"\)[\s\S]*?\}/g);
for (const match of matches) {
    const tableBlock = match[0];
    if (tableBlock.includes('id ') || tableBlock.includes('@id')) {
        tables.push(match[1]);
    }
}
const skipTables = ['model_has_roles', 'model_has_permissions', 'role_has_permissions', 'password_resets', 'migrations'];
const targetTables = tables.filter(t => !skipTables.includes(t));

console.log(targetTables);
