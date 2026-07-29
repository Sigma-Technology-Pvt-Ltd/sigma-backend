import multer from 'multer';

// Use memory storage so we can process the image buffer with sharp before saving
const storage = multer.memoryStorage();

// Filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Filter for documents (PDF, DOC, images, etc.)
const docFilter = (req, file, cb) => {
    // allow pdf, doc, docx, images, zip
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
    if (file.mimetype.startsWith('image/') || allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only documents and images are allowed!'), false);
    }
};

export const uploadDocument = multer({
    storage: storage, // keep memory storage so controller can save with uuid
    fileFilter: docFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit for docs
    }
});
