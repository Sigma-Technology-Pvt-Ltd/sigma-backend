import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const plugins = await prisma.plugin.findMany({
            where: { status: 1 },
            orderBy: { id: 'desc' }
        });

        const formatted = plugins.map(item => ({
            title: item.title,
            type: item.type,
            code: item.code,
            tag_type: item.tagType
        }));

        return res.json({
            result: 'success',
            plugins: formatted
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
