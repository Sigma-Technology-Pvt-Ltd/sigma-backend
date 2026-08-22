import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

/**
 * GET /api/admin/agents
 * List all agent accounts with basic stats.
 */
export const getAllAgents = async (req, res) => {
    try {
        const agents = await prisma.agent.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        tickets: true,
                        remarks: true,
                    }
                }
            }
        });
        return res.status(200).json({ result: 'success', data: agents });
    } catch (error) {
        console.error('Error fetching agents:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * POST /api/admin/agents
 * Create a new agent account. Only admins can do this.
 */
export const createAgent = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ result: 'error', message: 'Name, email, and password are required' });
        }

        const existing = await prisma.agent.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ result: 'error', message: 'An agent with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const agent = await prisma.agent.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'agent',
                isActive: true,
                createdByAdminId: req.user ? parseInt(req.user.id) : null,
            },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
        });

        return res.status(201).json({ result: 'success', data: agent, message: 'Agent created successfully' });
    } catch (error) {
        console.error('Error creating agent:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * PUT /api/admin/agents/:id
 * Edit agent name, email, or role.
 */
export const updateAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;

        const agentId = parseInt(id);
        const existing = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!existing) {
            return res.status(404).json({ result: 'error', message: 'Agent not found' });
        }

        // Check email uniqueness if changed
        if (email && email !== existing.email) {
            const emailTaken = await prisma.agent.findUnique({ where: { email } });
            if (emailTaken) {
                return res.status(409).json({ result: 'error', message: 'Email already in use by another agent' });
            }
        }

        const agent = await prisma.agent.update({
            where: { id: agentId },
            data: {
                name: name || existing.name,
                email: email || existing.email,
                role: role || existing.role,
            },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
        });

        return res.status(200).json({ result: 'success', data: agent, message: 'Agent updated successfully' });
    } catch (error) {
        console.error('Error updating agent:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * PATCH /api/admin/agents/:id/toggle-status
 * Toggle isActive — immediately blocks suspended agents on their next request.
 */
export const toggleAgentStatus = async (req, res) => {
    try {
        const agentId = parseInt(req.params.id);
        const existing = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!existing) {
            return res.status(404).json({ result: 'error', message: 'Agent not found' });
        }

        const agent = await prisma.agent.update({
            where: { id: agentId },
            data: { isActive: !existing.isActive },
            select: { id: true, name: true, email: true, isActive: true }
        });

        const statusLabel = agent.isActive ? 'activated' : 'suspended';
        return res.status(200).json({
            result: 'success',
            data: agent,
            message: `Agent ${statusLabel} successfully`
        });
    } catch (error) {
        console.error('Error toggling agent status:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * PATCH /api/admin/agents/:id/reset-password
 * Admin resets an agent's password.
 */
export const resetAgentPassword = async (req, res) => {
    try {
        const agentId = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ result: 'error', message: 'New password must be at least 8 characters' });
        }

        const existing = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!existing) {
            return res.status(404).json({ result: 'error', message: 'Agent not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await prisma.agent.update({
            where: { id: agentId },
            data: { password: hashedPassword }
        });

        return res.status(200).json({ result: 'success', message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting agent password:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * DELETE /api/admin/agents/:id
 */
export const deleteAgent = async (req, res) => {
    try {
        const agentId = parseInt(req.params.id);
        const existing = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!existing) {
            return res.status(404).json({ result: 'error', message: 'Agent not found' });
        }

        await prisma.agent.delete({ where: { id: agentId } });
        return res.status(200).json({ result: 'success', message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Error deleting agent:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
