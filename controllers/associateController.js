import { PrismaClient } from '@prisma/client';
import { getImageUrl } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const categories = await prisma.associationCategory.findMany({
            where: { status: 1 },
            orderBy: { id: 'asc' }
        });

        const associates = await Promise.all(categories.map(async (cat) => {
            const items = await prisma.association.findMany({
                where: { categoryId: Number(cat.id), status: 1 },
                orderBy: { order: 'desc' }
            });

            return {
                title: cat.title,
                description: cat.description,
                items: items.map(item => ({
                    title: item.title,
                    links: item.links,
                    image: getImageUrl(item.image, '/frontend/images/associates/')
                }))
            };
        }));

        return res.json({
            result: 'success',
            associates
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
