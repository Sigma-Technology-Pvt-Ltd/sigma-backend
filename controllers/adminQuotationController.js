import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'quotations.json');

// Ensure data folder and quotations.json file exist
const initStorage = () => {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
};

const readQuotations = () => {
    initStorage();
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed reading quotations:', err);
        return [];
    }
};

const writeQuotations = (data) => {
    initStorage();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Generate random unique Quotation Number: e.g. SIGMA-QT-8510
const getNextQuotationNumber = (quotations) => {
    let rand = Math.floor(1000 + Math.random() * 9000);
    let num = `SIGMA-QT-${rand}`;
    while (quotations.some(q => q.quotationNumber === num)) {
        rand = Math.floor(1000 + Math.random() * 9000);
        num = `SIGMA-QT-${rand}`;
    }
    return num;
};

// Get all quotations
export const getAllQuotations = async (req, res) => {
    try {
        const quotations = readQuotations();
        // Sort descending by date
        quotations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.status(200).json({ result: 'success', data: quotations });
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Get next available quotation number
export const getNextNumber = async (req, res) => {
    try {
        const quotations = readQuotations();
        const nextNumber = getNextQuotationNumber(quotations);
        return res.status(200).json({ result: 'success', quotationNumber: nextNumber });
    } catch (error) {
        return res.status(500).json({ result: 'error', message: 'Failed to generate quotation number' });
    }
};

// Get single quotation by ID
export const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const quotations = readQuotations();
        const found = quotations.find(q => String(q.id) === String(id));
        if (!found) {
            return res.status(404).json({ result: 'error', message: 'Quotation not found' });
        }
        return res.status(200).json({ result: 'success', data: found });
    } catch (error) {
        console.error('Error getting quotation:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Save / Create quotation
export const saveQuotation = async (req, res) => {
    try {
        const quotations = readQuotations();
        const body = req.body;

        const quotationNumber = body.quotationNumber || getNextQuotationNumber(quotations);

        const newQuotation = {
            id: body.id || uuidv4(),
            quotationNumber,
            enquiryId: body.enquiryId || null,
            customer: {
                name: body.customer?.name || '',
                email: body.customer?.email || '',
                phone: body.customer?.phone || '',
                company: body.customer?.company || '',
                address: body.customer?.address || '',
                panVat: body.customer?.panVat || ''
            },
            projectTitle: body.projectTitle || 'Quotation for Sigma Products',
            date: body.date || new Date().toLocaleDateString('en-GB'),
            validity: body.validity || '30 Days',
            deliveryTime: body.deliveryTime || '2-3 Working Weeks',
            items: body.items || [],
            subtotal: Number(body.subtotal || 0),
            isVatApplicable: Boolean(body.isVatApplicable),
            vatRate: 13,
            vatAmount: Number(body.vatAmount || 0),
            grandTotal: Number(body.grandTotal || 0),
            amountInWords: body.amountInWords || '',
            terms: body.terms || [],
            remarks: body.remarks || '',
            enquiryRemarks: body.enquiryRemarks || '',
            authorizedSignature: body.authorizedSignature || '',
            status: body.status || 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existingIndex = quotations.findIndex(q => String(q.id) === String(newQuotation.id));
        if (existingIndex >= 0) {
            quotations[existingIndex] = { ...quotations[existingIndex], ...newQuotation, updatedAt: new Date().toISOString() };
        } else {
            quotations.unshift(newQuotation);
        }

        writeQuotations(quotations);

        return res.status(201).json({
            result: 'success',
            message: 'Quotation saved successfully',
            data: newQuotation
        });
    } catch (error) {
        console.error('Error saving quotation:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete quotation
export const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        let quotations = readQuotations();
        quotations = quotations.filter(q => String(q.id) !== String(id));
        writeQuotations(quotations);
        return res.status(200).json({ result: 'success', message: 'Quotation deleted successfully' });
    } catch (error) {
        console.error('Error deleting quotation:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
