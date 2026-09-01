import { PrismaClient } from '@prisma/client';
import cache from '../utils/cache.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const cached = cache.get('faqs:index');
        if (cached) {
            return res.json(cached);
        }

        const [faqTypes, allFaqs] = await Promise.all([
            prisma.faqType.findMany({
                where: { status: 1 }
            }),
            prisma.faq.findMany({
                where: { status: 1 }
            })
        ]);

        const faqsByType = new Map();
        for (const faq of allFaqs) {
            const key = Number(faq.typeId);
            if (!faqsByType.has(key)) faqsByType.set(key, []);
            faqsByType.get(key).push({
                question: faq.question,
                answer: faq.answer
            });
        }

        const types = faqTypes.map((type) => ({
            title: type.title,
            faqs: faqsByType.get(Number(type.id)) || []
        }));

        const responseData = {
            result: 'success',
            faqs: types
        };

        cache.set('faqs:index', responseData, 600);
        return res.json(responseData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
