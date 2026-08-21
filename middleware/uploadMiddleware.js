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

// Allowed MIME types for documents — used for magic-byte verification in controllers
// Note: multer's fileFilter runs before the buffer is available, so we do a two-step check:
//   Step 1 (here): Accept file into memory based on declared MIME
//   Step 2 (controller): Verify actual file magic bytes via file-type package
export const DOCUMENT_ALLOWED_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
];

// Filter for documents (PDF, DOC, images, etc.) — declared MIME only, magic bytes checked in controller
const docFilter = (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isAllowedDoc = DOCUMENT_ALLOWED_MIMES.includes(file.mimetype);
    if (isImage || isAllowedDoc) {
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
