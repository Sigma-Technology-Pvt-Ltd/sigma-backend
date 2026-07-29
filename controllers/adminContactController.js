import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllContacts = async (req, res) => {
    try {
        const contacts = await prisma.contactForm.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
