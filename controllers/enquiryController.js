import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { sendEnquiryNotification } from '../utils/emailService.js';

const prisma = new PrismaClient();

export const store = async (req, res) => {
    try {
        const productSlug = req.params.product;
        const productData = await prisma.product.findFirst({
            where: { slug: productSlug }
        });

        if (!productData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const { first_name, last_name, email, phone_number, remarks } = req.body;

        // Basic validation matching Laravel rules
        const errors = {};
        if (!first_name || typeof first_name !== 'string') errors.first_name = ['The first name field is required.'];
        if (!last_name || typeof last_name !== 'string') errors.last_name = ['The last name field is required.'];
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = ['The email must be a valid email address.'];
        if (!phone_number || isNaN(Number(phone_number))) errors.phone_number = ['The phone number must be a number.'];

        if (Object.keys(errors).length > 0) {
            return res.json({
                result: 'error',
                message: errors
            });
        }

        const name = `${first_name} ${last_name}`;

        await prisma.productEnquiry.create({
            data: {
                slug: uuidv4(),
                productId: Number(productData.id),
                name: name,
                email: email,
                phoneNumber: phone_number.toString(),
                remarks: remarks || null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Trigger email notification in background (non-blocking, won't fail the user response)
        sendEnquiryNotification({
            customerName: name,
            customerEmail: email,
            phoneNumber: phone_number.toString(),
            productName: productData.title,
            productSlug: productData.slug,
            remarks: remarks
        }).catch(err => {
            console.error('[enquiryController] Background email notification error:', err.message);
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
