

export function generateEmailTemplate(title: string | null, message: string): string {
    // A clean, minimalist email template that works for 99% of generic notifications
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
        ${title ? `<h2 style="color: #333; margin-bottom: 16px;">${title}</h2>` : ''}
        <p style="color: #555; line-height: 1.6; font-size: 16px;">
            ${message}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated notification. Please do not reply.
        </p>
    </div>
    `;
}