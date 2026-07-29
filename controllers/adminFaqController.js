import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Get all FAQs
export const getAllFaqs = async (req, res) => {
    try {
        const faqs = await prisma.faq.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: faqs });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Get all FAQ Types for the dropdown
export const getFaqTypes = async (req, res) => {
    try {
        const faqTypes = await prisma.faqType.findMany({
            orderBy: { id: 'asc' }
        });
        return res.status(200).json({ result: 'success', data: faqTypes });
    } catch (error) {
        console.error('Error fetching FAQ Types:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create an FAQ
export const createFaq = async (req, res) => {
    try {
        const { typeId, question, answer, status } = req.body;
        
        if (!typeId || !question || !answer) {
            return res.status(400).json({ result: 'error', message: 'Type, Question, and Answer are required' });
        }

        const slug = slugify(question, { lower: true, strict: true }) + '-' + Date.now();

        const newFaq = await prisma.faq.create({
            data: {
                slug,
                typeId: parseInt(typeId),
                question,
                answer,
                status: status !== undefined ? parseInt(status) : 1,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newFaq, message: 'FAQ created successfully' });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update an FAQ
export const updateFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const { typeId, question, answer, status } = req.body;

        const faqId = parseInt(id);
        const existingFaq = await prisma.faq.findUnique({ where: { id: faqId } });
        if (!existingFaq) {
            return res.status(404).json({ result: 'error', message: 'FAQ not found' });
        }

        const slug = question && question !== existingFaq.question ? (slugify(question, { lower: true, strict: true }) + '-' + Date.now()) : existingFaq.slug;

        const updatedFaq = await prisma.faq.update({
            where: { id: faqId },
            data: {
                slug,
                typeId: typeId ? parseInt(typeId) : existingFaq.typeId,
                question: question || existingFaq.question,
                answer: answer || existingFaq.answer,
                status: status !== undefined ? parseInt(status) : existingFaq.status,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedFaq, message: 'FAQ updated successfully' });
    } catch (error) {
        console.error('Error updating FAQ:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete an FAQ
export const deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const faqId = parseInt(id);

        await prisma.faq.delete({ where: { id: faqId } });
        
        return res.status(200).json({ result: 'success', message: 'FAQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
