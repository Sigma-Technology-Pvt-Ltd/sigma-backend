import { Resend } from 'resend';

// Lazy-initialize — avoids crash at import time when RESEND_API_KEY is not set.
// The key is only required when an email is actually sent.
let _resend = null;
const getResend = () => {
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
    return _resend;
};

// From address — update once your domain is verified with Resend
const FROM_ADDRESS = process.env.RESEND_FROM || 'ClaimDesk <noreply@yourdomain.com>';
const COMPANY_NAME = 'Sigma Technologies';

/**
 * Send a ticket confirmation email to the customer.
 * @param {object} opts
 * @param {string} opts.to         - Customer email address
 * @param {string} opts.name       - Customer name
 * @param {string} opts.ticketNumber - e.g. "ST-00001"
 * @param {string} opts.issueType
 * @param {string} opts.productName
 */
export const sendTicketConfirmation = async ({ to, name, ticketNumber, issueType, productName }) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[emailService] RESEND_API_KEY not set — skipping confirmation email');
        return;
    }
    try {
        await getResend().emails.send({
            from: FROM_ADDRESS,
            to: [to],
            subject: `Your service request has been received — ${ticketNumber}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                    <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #f8fafc; margin: 0; font-size: 22px;">${COMPANY_NAME} — Service Request</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
                        <p>We've received your service request and our team will look into it shortly.</p>
                        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                            <p style="margin: 0 0 8px;"><strong>Ticket Number:</strong> <span style="color: #6d28d9; font-size: 20px; font-weight: bold;">${ticketNumber}</span></p>
                            <p style="margin: 0 0 8px;"><strong>Issue Type:</strong> ${issueType}</p>
                            ${productName ? `<p style="margin: 0;"><strong>Product:</strong> ${productName}</p>` : ''}
                        </div>
                        <p style="color: #64748b; font-size: 14px;">Please keep your ticket number handy for any future correspondence. Our support team will contact you if additional information is needed.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">${COMPANY_NAME} &mdash; Technical Support</p>
                    </div>
                </div>
            `,
        });
        console.log(`[emailService] Confirmation sent to ${to} for ticket ${ticketNumber}`);
    } catch (err) {
        // Non-fatal — log but don't crash the request
        console.error('[emailService] Failed to send confirmation email:', err.message);
    }
};

/**
 * Send a new-ticket alert to all active agents.
 * @param {object} opts
 * @param {string[]} opts.agentEmails - Array of active agent email addresses
 * @param {string} opts.ticketNumber
 * @param {string} opts.customerName
 * @param {string} opts.issueType
 * @param {string} opts.productName
 * @param {string} opts.description  - Truncated preview
 */
export const sendNewTicketAlert = async ({ agentEmails, ticketNumber, customerName, issueType, productName, description }) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[emailService] RESEND_API_KEY not set — skipping agent alert emails');
        return;
    }
    if (!agentEmails || agentEmails.length === 0) return;

    const claimDeskUrl = process.env.TICKETING_URL || 'https://claimdesk.yourdomain.com';
    const preview = description && description.length > 200 ? description.slice(0, 200) + '…' : description;

    try {
        await getResend().emails.send({
            from: FROM_ADDRESS,
            to: agentEmails,
            subject: `[${ticketNumber}] New service request — ${issueType}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                    <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #f8fafc; margin: 0; font-size: 22px;">ClaimDesk — New Ticket Alert</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                        <p>A new service ticket has been submitted and is waiting to be picked up.</p>
                        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                            <p style="margin: 0 0 8px;"><strong>Ticket:</strong> <span style="color: #6d28d9; font-weight: bold;">${ticketNumber}</span></p>
                            <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${customerName}</p>
                            <p style="margin: 0 0 8px;"><strong>Issue Type:</strong> ${issueType}</p>
                            ${productName ? `<p style="margin: 0 0 8px;"><strong>Product:</strong> ${productName}</p>` : ''}
                            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">${preview}</p>
                        </div>
                        <a href="${claimDeskUrl}/dashboard/tickets" style="display: inline-block; background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in ClaimDesk</a>
                    </div>
                </div>
            `,
        });
        console.log(`[emailService] Agent alert sent for ticket ${ticketNumber} to ${agentEmails.length} agent(s)`);
    } catch (err) {
        console.error('[emailService] Failed to send agent alert email:', err.message);
    }
};
