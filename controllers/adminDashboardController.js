import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Get totals
        const [totalProducts, totalBlogs, totalContacts, totalSubscribers] = await Promise.all([
            prisma.product.count(),
            prisma.blog.count(),
            prisma.contactForm.count(),
            prisma.subscriber.count()
        ]);

        // 2. Get recent data
        const recentContacts = await prisma.contactForm.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const recentProducts = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                image: true,
                status: true,
                createdAt: true
            }
        });

        res.json({
            result: 'success',
            data: {
                totals: {
                    products: totalProducts,
                    blogs: totalBlogs,
                    contacts: totalContacts,
                    subscribers: totalSubscribers
                },
                recent: {
                    contacts: recentContacts,
                    products: recentProducts
                }
            }
        });
    } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
        res.status(500).json({ result: 'error', message: 'Failed to fetch dashboard stats' });
    }
};
