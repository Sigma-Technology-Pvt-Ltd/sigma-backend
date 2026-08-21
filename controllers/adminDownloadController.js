import { PrismaClient } from '@prisma/client';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { uploadToSupabase } from '../utils/supabaseStorage.js';
import { fileTypeFromBuffer } from 'file-type';
import { DOCUMENT_ALLOWED_MIMES } from '../middleware/uploadMiddleware.js';

const prisma = new PrismaClient();

// Helper to upload document file to Supabase Storage
const saveRawFile = async (buffer, originalName, folder) => {
    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}`;
    const contentType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
    await uploadToSupabase(buffer, folder, filename, contentType);
    return filename;
};

// Get all downloads
export const getAllDownloads = async (req, res) => {
    try {
        const downloads = await prisma.downloadFile.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: downloads });
    } catch (error) {
        console.error('Error fetching downloads:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a download
export const createDownload = async (req, res) => {
    try {
        const { title, productId } = req.body;
        
        if (!title || !productId || !req.file) {
            return res.status(400).json({ result: 'error', message: 'Title, Product, and File are required' });
        }

        // Magic-byte MIME verification — checks actual file content, not browser-declared type
        const detectedType = await fileTypeFromBuffer(req.file.buffer);
        const detectedMime = detectedType?.mime;
        const isImage = detectedMime?.startsWith('image/');
        if (!detectedMime || (!isImage && !DOCUMENT_ALLOWED_MIMES.includes(detectedMime))) {
            return res.status(400).json({ result: 'error', message: 'Invalid file type. Only PDF, Word documents, images, and ZIP files are allowed.' });
        }

        // Save raw file without sharp conversion
        const filename = await saveRawFile(req.file.buffer, req.file.originalname, 'documents');

        const originalFilename = req.file.originalname;

        const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();

        const newDownload = await prisma.downloadFile.create({
            data: {
                title,
                slug,
                productId: parseInt(productId),
                filename: filename,
                originalFilename: originalFilename,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newDownload, message: 'Download file created successfully' });
    } catch (error) {
        console.error('Error creating download:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update a download
export const updateDownload = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, productId } = req.body;

        const downloadId = parseInt(id);
        const existingDownload = await prisma.downloadFile.findUnique({ where: { id: downloadId } });
        if (!existingDownload) {
            return res.status(404).json({ result: 'error', message: 'Download file not found' });
        }

        let filename = existingDownload.filename;
        let originalFilename = existingDownload.originalFilename;
        if (req.file) {
            // Magic-byte MIME verification on update too
            const detectedType = await fileTypeFromBuffer(req.file.buffer);
            const detectedMime = detectedType?.mime;
            const isImage = detectedMime?.startsWith('image/');
            if (!detectedMime || (!isImage && !DOCUMENT_ALLOWED_MIMES.includes(detectedMime))) {
                return res.status(400).json({ result: 'error', message: 'Invalid file type. Only PDF, Word documents, images, and ZIP files are allowed.' });
            }
            filename = await saveRawFile(req.file.buffer, req.file.originalname, 'documents');
            originalFilename = req.file.originalname;
        }

        const slug = title && title !== existingDownload.title ? (slugify(title, { lower: true, strict: true }) + '-' + Date.now()) : existingDownload.slug;

        const updatedDownload = await prisma.downloadFile.update({
            where: { id: downloadId },
            data: {
                title: title || existingDownload.title,
                slug: slug,
                productId: productId ? parseInt(productId) : existingDownload.productId,
                filename: filename,
                originalFilename: originalFilename,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedDownload, message: 'Download file updated successfully' });
    } catch (error) {
        console.error('Error updating download:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a download
export const deleteDownload = async (req, res) => {
    try {
        const { id } = req.params;
        const downloadId = parseInt(id);

        await prisma.downloadFile.delete({ where: { id: downloadId } });
        
        return res.status(200).json({ result: 'success', message: 'Download file deleted successfully' });
    } catch (error) {
        console.error('Error deleting download:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
