import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Get all testimonials
export const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: testimonials });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a testimonial
export const createTestimonial = async (req, res) => {
    try {
        const { fullName, companyName, position, message, status } = req.body;
        
        if (!fullName || !message) {
            return res.status(400).json({ result: 'error', message: 'FullName and Message are required' });
        }

        let imageName = null;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'testimonials');
        }

        const slug = slugify(fullName, { lower: true, strict: true }) + '-' + Date.now();

        const newTestimonial = await prisma.testimonial.create({
            data: {
                fullName,
                slug,
                companyName: companyName || null,
                position: position || null,
                message: message,
                status: status !== undefined ? parseInt(status) : 1,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newTestimonial, message: 'Testimonial created successfully' });
    } catch (error) {
        console.error('Error creating testimonial:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update a testimonial
export const updateTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, companyName, position, message, status } = req.body;

        const testimonialId = parseInt(id);
        const existingTestimonial = await prisma.testimonial.findUnique({ where: { id: testimonialId } });
        if (!existingTestimonial) {
            return res.status(404).json({ result: 'error', message: 'Testimonial not found' });
        }

        let imageName = existingTestimonial.image;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'testimonials');
        }

        const slug = fullName && fullName !== existingTestimonial.fullName ? (slugify(fullName, { lower: true, strict: true }) + '-' + Date.now()) : existingTestimonial.slug;

        const updatedTestimonial = await prisma.testimonial.update({
            where: { id: testimonialId },
            data: {
                fullName: fullName || existingTestimonial.fullName,
                slug: slug,
                companyName: companyName !== undefined ? companyName : existingTestimonial.companyName,
                position: position !== undefined ? position : existingTestimonial.position,
                message: message !== undefined ? message : existingTestimonial.message,
                status: status !== undefined ? parseInt(status) : existingTestimonial.status,
                image: imageName,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedTestimonial, message: 'Testimonial updated successfully' });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a testimonial
export const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonialId = parseInt(id);

        await prisma.testimonial.delete({ where: { id: testimonialId } });
        
        return res.status(200).json({ result: 'success', message: 'Testimonial deleted successfully' });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
