import crypto from 'crypto';

// In-memory store for previews. In production with multiple instances, use Redis.
// Key: secret uuid, Value: preview data and timestamp
const previewStore = new Map();

// Clean up old previews every 15 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of previewStore.entries()) {
        if (now - value.timestamp > 15 * 60 * 1000) { // 15 mins expiry
            previewStore.delete(key);
        }
    }
}, 15 * 60 * 1000);

export const createPreview = async (req, res) => {
    try {
        const previewId = crypto.randomUUID();
        
        // Ensure image file URL can be temporarily represented if passed
        // For FormData, the file would be in req.file, other fields in req.body.
        // We will store everything together.
        
        const previewData = { ...req.body };
        
        if (req.file) {
            // We save the temporary uploaded file name/path so the frontend can fetch it.
            // But since the frontend uses http://localhost:3000/frontend/images/products/...
            // we might have to just rely on the existing image if editing, or a base64 string if it's new.
            // For simplicity, we just store the file filename if multer processed it.
            previewData.image = req.file.filename;
        }

        previewStore.set(previewId, {
            data: previewData,
            timestamp: Date.now()
        });

        res.json({
            result: 'success',
            previewId: previewId
        });
    } catch (error) {
        console.error('Failed to create preview', error);
        res.status(500).json({ result: 'error', message: 'Failed to create preview' });
    }
};

export const getPreview = async (req, res) => {
    try {
        const { id } = req.params;
        const preview = previewStore.get(id);

        if (!preview) {
            return res.status(404).json({ result: 'error', message: 'Preview not found or expired' });
        }

        res.json({
            result: 'success',
            data: preview.data
        });
    } catch (error) {
        console.error('Failed to fetch preview', error);
        res.status(500).json({ result: 'error', message: 'Failed to fetch preview' });
    }
};
