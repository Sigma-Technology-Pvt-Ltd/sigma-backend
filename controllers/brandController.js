import { PrismaClient } from '@prisma/client';
import { getImageUrl } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const brands = await prisma.brand.findMany({
            where: { status: 1 },
            orderBy: { id: 'desc' }
        });

        const formatted = brands.map(item => ({
            id: Number(item.id),
            slug: item.slug,
            title: item.title,
            icon: null,
            image: getImageUrl(item.image, '/frontend/images/brands/')
        }));

        return res.json({
            result: 'success',
            brands: formatted
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
