import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const store = async (req, res) => {
    try {
        const { email } = req.body;

        // Validation based on Laravel's SubscriberController
        const errors = {};
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = ['The email must be a valid email address.'];

        if (Object.keys(errors).length > 0) {
            return res.json({
                result: 'error',
                message: errors
            });
        }

        await prisma.subscriber.create({
            data: {
                slug: uuidv4(),
                email,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return res.json({
            result: 'success',
            message: "Thank you!, We 'll notify with our offers, Blog & News."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
