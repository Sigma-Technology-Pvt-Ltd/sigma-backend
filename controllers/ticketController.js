import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import { sendTicketConfirmation, sendNewTicketAlert } from '../utils/emailService.js';

const prisma = new PrismaClient();

/**
 * Generate the next sequential ticket number in format ST-00001
 */
async function generateTicketNumber() {
    const last = await prisma.ticket.findFirst({
        orderBy: { id: 'desc' },
        select: { ticketNumber: true }
    });

    let nextNum = 1;
    if (last && last.ticketNumber) {
        const match = last.ticketNumber.match(/ST-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
    }
    return `ST-${String(nextNum).padStart(5, '0')}`;
}

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/tickets/products
 * Public list of active products for dropdown selection.
 */
export const getPublicProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, title: true, slug: true },
            orderBy: { title: 'asc' }
        });
        
        // Serialize BigInt IDs to numbers
        const formatted = products.map(p => ({
            id: Number(p.id),
            title: p.title,
            slug: p.slug
        }));

        return res.status(200).json({ result: 'success', data: formatted });
    } catch (error) {
        console.error('Error fetching public products:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * POST /api/tickets
 * Public endpoint — creates a new support ticket. No auth required.
 */
export const createTicket = async (req, res) => {
    try {
        const { productId, productName, customerName, customerEmail, customerPhone, issueType, description } = req.body;

        // Validation
        const errors = {};
        if (!customerName) errors.customerName = 'Customer name is required';
        if (!customerEmail || !/^\S+@\S+\.\S+$/.test(customerEmail)) errors.customerEmail = 'Valid email is required';
        if (!customerPhone) errors.customerPhone = 'Phone number is required';
        if (!issueType) errors.issueType = 'Issue type is required';
        if (!description || description.trim().length < 10) errors.description = 'Description must be at least 10 characters';

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ result: 'error', message: errors });
        }

        const ticketNumber = await generateTicketNumber();

        // Resolve product name if productId was provided but no productName
        let resolvedProductName = productName || null;
        if (productId && !resolvedProductName) {
            try {
                const product = await prisma.product.findUnique({
                    where: { id: BigInt(productId) },
                    select: { title: true }
                });
                if (product) resolvedProductName = product.title;
            } catch {
                // If BigInt fails or product not found, continue gracefully
            }
        }

        // Create ticket
        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber,
                productId: productId ? parseInt(productId) : null,
                productName: resolvedProductName,
                customerName,
                customerEmail,
                customerPhone,
                issueType,
                description,
                status: 'Open',
            }
        });

        // Upload images if any
        if (req.files && req.files.length > 0) {
            const imageUploads = await Promise.all(
                req.files.map(file => processAndSaveImage(file.buffer, 'ticket-media'))
            );
            await prisma.ticketImage.createMany({
                data: imageUploads.map(filename => ({
                    ticketId: ticket.id,
                    imageUrl: filename,
                }))
            });
        }

        // Log creation activity
        await prisma.ticketActivity.create({
            data: {
                ticketId: ticket.id,
                actorName: customerName,
                action: 'created',
                detail: `Ticket ${ticketNumber} created — Issue: ${issueType}`,
            }
        });

        // Send confirmation email to customer (non-blocking)
        sendTicketConfirmation({
            to: customerEmail,
            name: customerName,
            ticketNumber,
            issueType,
            productName: resolvedProductName,
        });

        // Send alert to all active agents (non-blocking)
        const activeAgents = await prisma.agent.findMany({
            where: { isActive: true },
            select: { email: true }
        });
        sendNewTicketAlert({
            agentEmails: activeAgents.map(a => a.email),
            ticketNumber,
            customerName,
            issueType,
            productName: resolvedProductName,
            description,
        });

        return res.status(201).json({
            result: 'success',
            message: 'Your service request has been submitted successfully.',
            data: { ticketNumber, id: ticket.id }
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// ─── Agent-Protected Routes ───────────────────────────────────────────────────

/**
 * GET /api/tickets
 * Paginated ticket list with status/search filters.
 */
export const getTickets = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {};
        if (status && status !== 'All') where.status = status;
        if (search) {
            where.OR = [
                { ticketNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { productName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    agent: { select: { id: true, name: true } },
                    _count: { select: { images: true, remarks: true } }
                }
            }),
            prisma.ticket.count({ where })
        ]);

        return res.status(200).json({
            result: 'success',
            data: tickets,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * GET /api/tickets/:id
 * Single ticket with all related data.
 */
export const getTicket = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                agent: { select: { id: true, name: true, email: true } },
                images: true,
                remarks: {
                    include: { agent: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'asc' }
                },
                activities: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (!ticket) {
            return res.status(404).json({ result: 'error', message: 'Ticket not found' });
        }

        return res.status(200).json({ result: 'success', data: ticket });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * PATCH /api/tickets/:id/pick
 * Assign this ticket to the currently logged-in agent.
 */
export const pickTicket = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const agent = req.agent;

        const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!existing) {
            return res.status(404).json({ result: 'error', message: 'Ticket not found' });
        }
        if (existing.assignedAgentId) {
            return res.status(409).json({ result: 'error', message: 'This ticket has already been picked up by another agent' });
        }

        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assignedAgentId: agent.id,
                status: existing.status === 'Open' ? 'In Progress' : existing.status,
            }
        });

        await prisma.ticketActivity.create({
            data: {
                ticketId,
                actorName: agent.name,
                action: 'assigned',
                detail: `Picked up by ${agent.name}`,
            }
        });

        if (ticket.status !== existing.status) {
            await prisma.ticketActivity.create({
                data: {
                    ticketId,
                    actorName: agent.name,
                    action: 'status_changed',
                    detail: `Status changed from "${existing.status}" to "In Progress"`,
                }
            });
        }

        return res.status(200).json({ result: 'success', data: ticket, message: 'Ticket picked up successfully' });
    } catch (error) {
        console.error('Error picking ticket:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * PATCH /api/tickets/:id/status
 * Update ticket status.
 */
export const updateStatus = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { status } = req.body;
        const agent = req.agent;

        const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ result: 'error', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!existing) {
            return res.status(404).json({ result: 'error', message: 'Ticket not found' });
        }

        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status }
        });

        await prisma.ticketActivity.create({
            data: {
                ticketId,
                actorName: agent.name,
                action: 'status_changed',
                detail: `Status changed from "${existing.status}" to "${status}"`,
            }
        });

        return res.status(200).json({ result: 'success', data: ticket, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * POST /api/tickets/:id/remarks
 * Add an internal remark/comment to a ticket.
 */
export const addRemark = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { message } = req.body;
        const agent = req.agent;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ result: 'error', message: 'Remark message is required' });
        }

        const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!existing) {
            return res.status(404).json({ result: 'error', message: 'Ticket not found' });
        }

        const remark = await prisma.ticketRemark.create({
            data: { ticketId, agentId: agent.id, message },
            include: { agent: { select: { id: true, name: true } } }
        });

        await prisma.ticketActivity.create({
            data: {
                ticketId,
                actorName: agent.name,
                action: 'remark_added',
                detail: `${agent.name} added an internal remark`,
            }
        });

        return res.status(201).json({ result: 'success', data: remark, message: 'Remark added' });
    } catch (error) {
        console.error('Error adding remark:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// ─── Admin-Only Routes ────────────────────────────────────────────────────────

/**
 * GET /api/admin/ticket-stats
 * Summary counts + per-agent breakdown for the admin overview.
 */
export const getTicketStats = async (req, res) => {
    try {
        const [statusCounts, agentBreakdown, recentTickets] = await Promise.all([
            // Count by status
            prisma.ticket.groupBy({
                by: ['status'],
                _count: { status: true }
            }),
            // Per-agent stats
            prisma.agent.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isActive: true,
                    _count: { select: { tickets: true } },
                    tickets: {
                        where: { status: 'Resolved' },
                        select: { id: true }
                    }
                }
            }),
            // Recent 50 tickets for drill-down
            prisma.ticket.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    agent: { select: { id: true, name: true } },
                    _count: { select: { remarks: true, images: true } }
                }
            })
        ]);

        const counts = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
        statusCounts.forEach(s => { counts[s.status] = s._count.status; });

        const agents = agentBreakdown.map(a => ({
            id: a.id,
            name: a.name,
            email: a.email,
            isActive: a.isActive,
            assignedCount: a._count.tickets,
            resolvedCount: a.tickets.length,
        }));

        return res.status(200).json({
            result: 'success',
            data: {
                counts,
                total: Object.values(counts).reduce((a, b) => a + b, 0),
                agents,
                recentTickets
            }
        });
    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * GET /api/admin/tickets/:id
 * Admin drill-down — full ticket detail.
 */
export const getTicketAdmin = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                agent: { select: { id: true, name: true, email: true } },
                images: true,
                remarks: {
                    include: { agent: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'asc' }
                },
                activities: { orderBy: { createdAt: 'asc' } }
            }
        });
        if (!ticket) {
            return res.status(404).json({ result: 'error', message: 'Ticket not found' });
        }
        return res.status(200).json({ result: 'success', data: ticket });
    } catch (error) {
        console.error('Error fetching ticket (admin):', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
