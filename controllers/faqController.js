import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const faqTypes = await prisma.faqType.findMany({
            where: { status: 1 }
        });

        const types = await Promise.all(faqTypes.map(async (type) => {
            const faqs = await prisma.faq.findMany({
                where: { typeId: Number(type.id), status: 1 }
            });

            return {
                title: type.title,
                faqs: faqs.map(faq => ({
                    question: faq.question,
                    answer: faq.answer
                }))
            };
        }));

        return res.json({
            result: 'success',
            faqs: types 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
