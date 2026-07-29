import { PrismaClient } from '@prisma/client';
import { getImageUrl } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            where: { status: 1 },
            orderBy: { id: 'desc' }
        });

        const formatted = testimonials.map(item => ({
            name: item.fullName,
            company: item.companyName,
            position: item.position,
            message: item.message,
            image: getImageUrl(item.image, '/frontend/images/testimonials/')
        }));

        return res.json({
            result: 'success',
            testimonials: formatted
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
