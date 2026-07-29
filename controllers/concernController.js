import { PrismaClient } from '@prisma/client';
import { getImageUrl } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const concerns = await prisma.concern.findMany({
            where: { status: 1 },
            orderBy: { id: 'desc' }
        });

        const formattedConcerns = concerns.map(item => ({
            title: item.title,
            image: getImageUrl(item.image, '/frontend/images/concerns/'),
            description: item.description
        }));

        return res.json({
            result: 'success',
            concerns: formattedConcerns
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
