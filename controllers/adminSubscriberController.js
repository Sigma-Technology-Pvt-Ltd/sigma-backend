import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await prisma.subscriber.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: subscribers });
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
