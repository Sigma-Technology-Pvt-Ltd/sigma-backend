import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const store = async (req, res) => {
    try {
        const { name, email, phone_number, subject, message } = req.body;

        // Validation based on Laravel's ContactController
        const errors = {};
        if (!name || typeof name !== 'string') errors.name = ['The name field is required.'];
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = ['The email must be a valid email address.'];
        if (!phone_number || isNaN(Number(phone_number))) errors.phone_number = ['The phone number must be a number.'];
        if (!subject || typeof subject !== 'string') errors.subject = ['The subject field is required.'];
        if (!message || typeof message !== 'string') errors.message = ['The message field is required.'];

        if (Object.keys(errors).length > 0) {
            return res.json({
                result: 'error',
                message: errors
            });
        }

        await prisma.contactForm.create({
            data: {
                slug: uuidv4(),
                name,
                email,
                phone: phone_number.toString(),
                subject,
                message,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return res.json({
            result: 'success',
            message: "Thank you!, Your enquiry has been send, We 'll contact you soon"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
