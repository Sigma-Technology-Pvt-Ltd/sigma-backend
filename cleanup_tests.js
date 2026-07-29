import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const p = new PrismaClient();

const cleanUp = async () => {
    try {
        // Find test products
        const products = await p.product.findMany({
            where: { title: { contains: 'Script Test Product' } }
        });
        
        for (const prod of products) {
            console.log('Deleting product:', prod.id, prod.title);
            if (prod.image) {
                const imgPath = path.join(process.cwd(), 'public/frontend/images/products', prod.image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
            await p.product.delete({ where: { id: prod.id } });
        }

        // Find test categories
        const categories = await p.category.findMany({
            where: { title: { contains: 'Script Test Category' } }
        });

        for (const cat of categories) {
            console.log('Deleting category:', cat.id, cat.title);
            if (cat.image) {
                const imgPath = path.join(process.cwd(), 'public/frontend/images/categories', cat.image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
            await p.category.delete({ where: { id: cat.id } });
        }
        
        console.log('Cleanup complete');
    } catch (e) {
        console.error('Error during cleanup', e);
    } finally {
        await p.$disconnect();
    }
};

cleanUp();
