import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Get all jobs
export const getAllCareers = async (req, res) => {
    try {
        const jobs = await prisma.jobList.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: jobs });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a job
export const createCareer = async (req, res) => {
    try {
        const { title, salary, deadline, education, experience, noOfVacancy, type, description, summary, status } = req.body;
        
        if (!title) {
            return res.status(400).json({ result: 'error', message: 'Title is required' });
        }

        let imageName = null;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'careers'); // fallback or create folder if needed. Using 'careers' standard.
        }

        const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();

        const newJob = await prisma.jobList.create({
            data: {
                title,
                slug,
                salary: salary || 'Negotiable',
                deadline: deadline || null,
                education: education || null,
                experience: experience || null,
                noOfVacancy: noOfVacancy || null,
                type: type || null,
                description: description || null,
                summary: summary || null,
                status: status !== undefined ? parseInt(status) : 1,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newJob, message: 'Career created successfully' });
    } catch (error) {
        return res.status(500).json({ result: 'error', message: error.message, stack: error.stack });
    }
};

// Update a job
export const updateCareer = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, salary, deadline, education, experience, noOfVacancy, type, description, summary, status } = req.body;

        const jobId = parseInt(id);
        const existingJob = await prisma.jobList.findUnique({ where: { id: jobId } });
        if (!existingJob) {
            return res.status(404).json({ result: 'error', message: 'Career not found' });
        }

        let imageName = existingJob.image;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'careers');
        }

        const slug = title && title !== existingJob.title ? (slugify(title, { lower: true, strict: true }) + '-' + Date.now()) : existingJob.slug;

        const updatedJob = await prisma.jobList.update({
            where: { id: jobId },
            data: {
                title: title || existingJob.title,
                slug: slug,
                salary: salary !== undefined ? salary : existingJob.salary,
                deadline: deadline !== undefined ? deadline : existingJob.deadline,
                education: education !== undefined ? education : existingJob.education,
                experience: experience !== undefined ? experience : existingJob.experience,
                noOfVacancy: noOfVacancy !== undefined ? noOfVacancy : existingJob.noOfVacancy,
                type: type !== undefined ? type : existingJob.type,
                description: description !== undefined ? description : existingJob.description,
                summary: summary !== undefined ? summary : existingJob.summary,
                status: status !== undefined ? parseInt(status) : existingJob.status,
                image: imageName,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedJob, message: 'Career updated successfully' });
    } catch (error) {
        console.error('Error updating career:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a job
export const deleteCareer = async (req, res) => {
    try {
        const { id } = req.params;
        const jobId = parseInt(id);

        await prisma.jobList.delete({ where: { id: jobId } });
        
        return res.status(200).json({ result: 'success', message: 'Career deleted successfully' });
    } catch (error) {
        console.error('Error deleting career:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
