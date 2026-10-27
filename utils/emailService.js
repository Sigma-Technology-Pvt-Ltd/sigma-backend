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

/**
 * Send new product enquiry notification to admin and confirmation to customer.
 * Uses process.env.RESEND_FROM dynamically.
 */
export const sendEnquiryNotification = async ({
    customerName,
    customerEmail,
    phoneNumber,
    productName,
    productSlug,
    remarks
}) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[emailService] RESEND_API_KEY not set — skipping enquiry emails');
        return;
    }

    const adminFromAddress = process.env.RESEND_FROM_ADMIN || process.env.RESEND_FROM || 'Sigma Technologies <noreply@sigmatechnologies.com.np>';
    const customerFromAddress = process.env.RESEND_FROM_CUSTOMER || 'Sigma Technologies <info@sigmatechnologies.com.np>';
    const adminEmail = process.env.ADMIN_ENQUIRY_EMAIL || 'info@sigmatechnologies.com.np';
    const frontendUrl = process.env.FRONTEND_URL || 'https://sigmatechnologies.com.np';
    const adminUrl = process.env.ADMIN_URL || 'https://sigma-admin-eta.vercel.app';
    const productUrl = productSlug ? `${frontendUrl}/product/${productSlug}` : frontendUrl;

    const formattedDate = new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Kathmandu',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    // 1. Send Admin / Sales Team Notification
    try {
        await getResend().emails.send({
            from: adminFromAddress,
            to: [adminEmail],
            replyTo: customerEmail || undefined,
            subject: `[New Website Enquiry] ${productName || 'Product'} - ${customerName}`,
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="x-apple-disable-message-reformatting">
                    <title>New Website Enquiry</title>
                    <style>
                        * { box-sizing: border-box; }
                        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
                        @media only screen and (max-width: 600px) {
                            .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
                            .email-header { padding: 16px 14px !important; }
                            .email-body { padding: 18px 12px !important; }
                            .table-box { width: 100% !important; margin-bottom: 16px !important; }
                            .td-label { width: 36% !important; padding: 10px 10px !important; font-size: 12px !important; }
                            .td-value { width: 64% !important; padding: 10px 10px !important; font-size: 13px !important; }
                            .btn-link { display: block !important; width: 100% !important; padding: 14px 10px !important; text-align: center !important; }
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; width: 100% !important;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 12px 0;">
                        <tr>
                            <td align="center" style="padding: 0 8px;">
                                <table class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; table-layout: fixed;">
                                    <tr>
                                        <td class="email-header" style="background-color: #ffffff; padding: 18px 24px; border-bottom: 2px solid #1a4b9c;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="left" valign="middle">
                                                        <img src="https://sigmatechnologies.com.np/images/png/logo/sigma.png" alt="Sigma Technologies" style="height: 36px; max-width: 160px; display: block; border: 0;" />
                                                    </td>
                                                    <td align="right" valign="middle" style="color: #1a4b9c; font-size: 11px; font-weight: 700; letter-spacing: 0.8px;">
                                                        WEBSITE ENQUIRY
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="email-body" style="padding: 24px 20px;">
                                            <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.3;">New Product Enquiry Received</h2>
                                            <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.5;">Submitted via website on ${formattedDate} (NPT).</p>

                                            <!-- Customer Information Card -->
                                            <table class="table-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px; table-layout: fixed;">
                                                <tr>
                                                    <td colspan="2" style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                                                        Customer Information
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Full Name</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${customerName}</td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Phone</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #1a4b9c; border-bottom: 1px solid #f1f5f9; word-break: break-word;">
                                                        <a href="tel:${phoneNumber}" style="color: #1a4b9c; text-decoration: none;">${phoneNumber}</a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; word-break: break-word;">Email</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #0f172a; word-break: break-word;">
                                                        ${customerEmail ? `<a href="mailto:${customerEmail}" style="color: #1a4b9c; text-decoration: none;">${customerEmail}</a>` : 'Not provided'}
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Product Specifications Card -->
                                            <table class="table-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 22px; table-layout: fixed;">
                                                <tr>
                                                    <td colspan="2" style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                                                        Enquiry Specifications
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Product</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">
                                                        <a href="${productUrl}" target="_blank" style="color: #1a4b9c; text-decoration: none;">${productName || 'View Product'}</a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; vertical-align: top; word-break: break-word;">Remarks</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #334155; line-height: 1.5; word-break: break-word;">${remarks || 'Standard Quotation Request'}</td>
                                                </tr>
                                            </table>

                                            <!-- CTA Button -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        <a class="btn-link" href="${adminUrl}/enquiries" target="_blank" style="display: inline-block; background-color: #1a4b9c; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px; box-sizing: border-box;">
                                                            View in Sigma Admin Panel
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 16px 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                            Sigma Technologies Pvt. Ltd. &bull; Aspen Marg, Maitighar, Kathmandu<br />
                                            Automated notification sent by Sigma website system.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });
        console.log(`[emailService] Enquiry alert sent to ${adminEmail} for product "${productName}"`);
    } catch (adminErr) {
        console.error('[emailService] Failed to send admin enquiry alert:', adminErr.message);
    }

    // 2. Send Customer Confirmation Email (if valid customer email provided)
    if (customerEmail && customerEmail.includes('@')) {
        try {
            await getResend().emails.send({
                from: customerFromAddress,
                to: [customerEmail],
                subject: `Enquiry Received: ${productName || 'Sigma Technologies'}`,
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="x-apple-disable-message-reformatting">
                        <title>Enquiry Confirmation</title>
                        <style>
                            * { box-sizing: border-box; }
                            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                            img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
                            @media only screen and (max-width: 600px) {
                                .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
                                .email-header { padding: 16px 14px !important; }
                                .email-body { padding: 18px 12px !important; }
                                .table-box { width: 100% !important; margin-bottom: 16px !important; }
                                .td-label { width: 36% !important; padding: 10px 10px !important; font-size: 12px !important; }
                                .td-value { width: 64% !important; padding: 10px 10px !important; font-size: 13px !important; }
                            }
                        </style>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; width: 100% !important;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 12px 0;">
                            <tr>
                                <td align="center" style="padding: 0 8px;">
                                    <table class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; table-layout: fixed;">
                                        <tr>
                                            <td class="email-header" style="background-color: #ffffff; padding: 18px 24px; border-bottom: 2px solid #1a4b9c;">
                                                <img src="https://sigmatechnologies.com.np/images/png/logo/sigma.png" alt="Sigma Technologies" style="height: 36px; max-width: 160px; display: block; border: 0;" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="email-body" style="padding: 24px 20px;">
                                                <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.3;">Thank You for Contacting Us</h2>
                                                <p style="margin: 0 0 18px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                                                    Dear <strong>${customerName}</strong>,<br /><br />
                                                    We have received your enquiry regarding <strong>${productName || 'our solutions'}</strong>. Our technical sales team is reviewing your requirements and will reach out to you shortly.
                                                </p>

                                                <table class="table-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 18px 0; table-layout: fixed;">
                                                    <tr>
                                                        <td colspan="2" style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                                                            Enquiry Summary
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Product</td>
                                                        <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${productName || '-'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Phone</td>
                                                        <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${phoneNumber}</td>
                                                    </tr>
                                                    <tr>
                                                        <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; word-break: break-word;">Remarks</td>
                                                        <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #334155; word-break: break-word; line-height: 1.4;">${remarks || 'Standard Quotation Request'}</td>
                                                    </tr>
                                                </table>

                                                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">Need immediate assistance?</p>
                                                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                                                    Direct Hotline: <strong style="color: #0f172a;">+977 9801113668</strong><br />
                                                    General Email: <a href="mailto:info@sigmatechnologies.com.np" style="color: #1a4b9c; text-decoration: none;">info@sigmatechnologies.com.np</a><br />
                                                    Showroom / Office: Aspen Marg, Maitighar, Kathmandu, Nepal
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="background-color: #f8fafc; padding: 16px 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                                Sigma Technologies Pvt. Ltd. &bull; A Unit of Kusum Group<br />
                                                Automated confirmation sent from official website.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            });
            console.log(`[emailService] Confirmation email sent to customer ${customerEmail}`);
        } catch (custErr) {
            console.error('[emailService] Failed to send customer confirmation email:', custErr.message);
        }
    }
};

/**
 * Send new contact us message notification to admin and confirmation to customer.
 */
export const sendContactNotification = async ({
    name,
    email,
    phoneNumber,
    subject,
    message
}) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[emailService] RESEND_API_KEY not set — skipping contact emails');
        return;
    }

    const adminFromAddress = process.env.RESEND_FROM_ADMIN || process.env.RESEND_FROM || 'Sigma Technologies <noreply@sigmatechnologies.com.np>';
    const customerFromAddress = process.env.RESEND_FROM_CUSTOMER || 'Sigma Technologies <info@sigmatechnologies.com.np>';
    const adminEmail = process.env.ADMIN_ENQUIRY_EMAIL || 'info@sigmatechnologies.com.np';
    const adminUrl = process.env.ADMIN_URL || 'https://sigma-admin-eta.vercel.app';

    const formattedDate = new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Kathmandu',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    // 1. Send Admin Alert
    try {
        await getResend().emails.send({
            from: adminFromAddress,
            to: [adminEmail],
            replyTo: email || undefined,
            subject: `[Contact Us Message] ${subject || 'General Inquiry'} - ${name}`,
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="x-apple-disable-message-reformatting">
                    <title>New Contact Us Message</title>
                    <style>
                        * { box-sizing: border-box; }
                        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
                        @media only screen and (max-width: 600px) {
                            .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
                            .email-header { padding: 16px 14px !important; }
                            .email-body { padding: 18px 12px !important; }
                            .table-box { width: 100% !important; margin-bottom: 16px !important; }
                            .td-label { width: 36% !important; padding: 10px 10px !important; font-size: 12px !important; }
                            .td-value { width: 64% !important; padding: 10px 10px !important; font-size: 13px !important; }
                            .btn-link { display: block !important; width: 100% !important; padding: 14px 10px !important; text-align: center !important; }
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; width: 100% !important;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 12px 0;">
                        <tr>
                            <td align="center" style="padding: 0 8px;">
                                <table class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; table-layout: fixed;">
                                    <tr>
                                        <td class="email-header" style="background-color: #ffffff; padding: 18px 24px; border-bottom: 2px solid #1a4b9c;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="left" valign="middle">
                                                        <img src="https://sigmatechnologies.com.np/images/png/logo/sigma.png" alt="Sigma Technologies" style="height: 36px; max-width: 160px; display: block; border: 0;" />
                                                    </td>
                                                    <td align="right" valign="middle" style="color: #1a4b9c; font-size: 11px; font-weight: 700; letter-spacing: 0.8px;">
                                                        CONTACT MESSAGE
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="email-body" style="padding: 24px 20px;">
                                            <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.3;">New Contact Us Submission</h2>
                                            <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.5;">Received via website contact form on ${formattedDate} (NPT).</p>

                                            <!-- Sender Details Table -->
                                            <table class="table-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px; table-layout: fixed;">
                                                <tr>
                                                    <td colspan="2" style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                                                        Sender Information
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Name</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${name}</td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Phone</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #1a4b9c; border-bottom: 1px solid #f1f5f9; word-break: break-word;">
                                                        <a href="tel:${phoneNumber}" style="color: #1a4b9c; text-decoration: none;">${phoneNumber}</a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Email</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">
                                                        <a href="mailto:${email}" style="color: #1a4b9c; text-decoration: none;">${email}</a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Subject</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${subject || 'General Inquiry'}</td>
                                                </tr>
                                                <tr>
                                                    <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; vertical-align: top; word-break: break-word;">Message</td>
                                                    <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #334155; line-height: 1.5; word-break: break-word;">${message}</td>
                                                </tr>
                                            </table>

                                            <!-- CTA Button -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        <a class="btn-link" href="${adminUrl}/contacts" target="_blank" style="display: inline-block; background-color: #1a4b9c; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 6px; box-sizing: border-box;">
                                                            View in Sigma Admin Panel
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 16px 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                            Sigma Technologies Pvt. Ltd. &bull; Aspen Marg, Maitighar, Kathmandu<br />
                                            Automated message alert sent by Sigma website system.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });
        console.log(`[emailService] Contact alert sent to ${adminEmail} for subject "${subject}"`);
    } catch (adminErr) {
        console.error('[emailService] Failed to send admin contact alert:', adminErr.message);
    }

    // 2. Send Customer Confirmation
    if (email && email.includes('@')) {
        try {
            await getResend().emails.send({
                from: customerFromAddress,
                to: [email],
                subject: `Message Received: ${subject || 'Contact Inquiry'} | Sigma Technologies`,
                html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="x-apple-disable-message-reformatting">
                        <title>Message Received</title>
                        <style>
                            * { box-sizing: border-box; }
                            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                            img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
                            @media only screen and (max-width: 600px) {
                                .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
                                .email-header { padding: 16px 14px !important; }
                                .email-body { padding: 18px 12px !important; }
                                .table-box { width: 100% !important; margin-bottom: 16px !important; }
                                .td-label { width: 36% !important; padding: 10px 10px !important; font-size: 12px !important; }
                                .td-value { width: 64% !important; padding: 10px 10px !important; font-size: 13px !important; }
                            }
                        </style>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; width: 100% !important;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 12px 0;">
                            <tr>
                                <td align="center" style="padding: 0 8px;">
                                    <table class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; table-layout: fixed;">
                                        <tr>
                                            <td class="email-header" style="background-color: #ffffff; padding: 18px 24px; border-bottom: 2px solid #1a4b9c;">
                                                <img src="https://sigmatechnologies.com.np/images/png/logo/sigma.png" alt="Sigma Technologies" style="height: 36px; max-width: 160px; display: block; border: 0;" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="email-body" style="padding: 24px 20px;">
                                                <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.3;">Thank You for Reaching Out</h2>
                                                <p style="margin: 0 0 18px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                                                    Dear <strong>${name}</strong>,<br /><br />
                                                    Thank you for contacting Sigma Technologies. We have successfully received your message regarding "<strong>${subject || 'General Inquiry'}</strong>". A representative from our team will respond to your inquiry shortly.
                                                </p>

                                                <table class="table-box" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 18px 0; table-layout: fixed;">
                                                    <tr>
                                                        <td colspan="2" style="padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                                                            Message Summary
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Subject</td>
                                                        <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${subject || 'General Inquiry'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9; word-break: break-word;">Phone</td>
                                                        <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${phoneNumber}</td>
                                                    </tr>
                                                    <tr>
                                                        <td class="td-label" width="34%" style="padding: 10px 14px; font-size: 13px; color: #64748b; word-break: break-word;">Message</td>
                                                        <td class="td-value" width="66%" style="padding: 10px 14px; font-size: 13px; color: #334155; word-break: break-word; line-height: 1.4;">${message}</td>
                                                    </tr>
                                                </table>

                                                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">Need immediate assistance?</p>
                                                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                                                    Direct Hotline: <strong style="color: #0f172a;">+977 9801113668</strong><br />
                                                    General Email: <a href="mailto:info@sigmatechnologies.com.np" style="color: #1a4b9c; text-decoration: none;">info@sigmatechnologies.com.np</a><br />
                                                    Showroom / Office: Aspen Marg, Maitighar, Kathmandu, Nepal
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="background-color: #f8fafc; padding: 16px 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                                Sigma Technologies Pvt. Ltd. &bull; A Unit of Kusum Group<br />
                                                Automated confirmation sent from official website.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            });
            console.log(`[emailService] Contact confirmation email sent to customer ${email}`);
        } catch (custErr) {
            console.error('[emailService] Failed to send contact confirmation email:', custErr.message);
        }
    }
};
