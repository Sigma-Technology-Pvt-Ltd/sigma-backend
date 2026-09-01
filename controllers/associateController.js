import { PrismaClient } from '@prisma/client';
import { getImageUrl } from '../utils/helpers.js';
import cache from '../utils/cache.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const cached = cache.get('associates:index');
        if (cached) {
            return res.json(cached);
        }

        const [categories, allItems] = await Promise.all([
            prisma.associationCategory.findMany({
                where: { status: 1 },
                orderBy: { id: 'asc' }
            }),
            prisma.association.findMany({
                where: { status: 1 },
                orderBy: { order: 'desc' }
            })
        ]);

        const itemsByCat = new Map();
        for (const item of allItems) {
            const key = Number(item.categoryId);
            if (!itemsByCat.has(key)) itemsByCat.set(key, []);
            itemsByCat.get(key).push({
                title: item.title,
                links: item.links,
                image: getImageUrl(item.image, '/frontend/images/associates/')
            });
        }

        const associates = categories.map((cat) => ({
            title: cat.title,
            description: cat.description,
            items: itemsByCat.get(Number(cat.id)) || []
        }));

        const responseData = {
            result: 'success',
            associates
        };

        cache.set('associates:index', responseData, 600);
        return res.json(responseData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
