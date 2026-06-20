export function generateSmsTemplate(title: string | null, message: string): string {
    
    if (!title) {
        return `${message}\n\n - Ping`;
    }

    return `${title}\n ${message}\n\n - Ping`;
}