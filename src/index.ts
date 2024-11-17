type MimeTypes = Record<string, string>;

interface CookieOptions {
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

class ResponseHelper {
    private currentResponse: Response | null;

    constructor() {
        this.currentResponse = null;
    }

    send(data: string | object | Buffer | ArrayBuffer, statusCode: number = 200): Response {
        const headers = new Headers();
        let body: string | Buffer | ArrayBuffer = data;

        if (typeof data === 'string') {
            const isHTML = data.trim().startsWith('<') || data.includes('<!DOCTYPE html>') || data.includes('<html');
            headers.set('Content-Type', isHTML ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
        } else if (data instanceof ArrayBuffer || Buffer.isBuffer(data)) {
            headers.set('Content-Type', 'application/octet-stream');
        } else {
            headers.set('Content-Type', 'application/json');
            body = JSON.stringify(data);
        }

        this.currentResponse = new Response(body, { status: statusCode, headers });
        return this.currentResponse;
    }

    html(content: string, statusCode: number = 200): Response {
        return this.send(content, statusCode).type('text/html; charset=utf-8');
    }

    async sendFile(filePath: string): Promise<Response> {
        try {
            const file = Bun.file(filePath);
            const exists = await file.exists();

            if (!exists) return this.status(404).send('File not found');

            const mimeTypes: MimeTypes = {
                html: 'text/html',
                css: 'text/css',
                js: 'application/javascript',
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                gif: 'image/gif',
                svg: 'image/svg+xml',
                json: 'application/json',
                pdf: 'application/pdf',
                txt: 'text/plain',
            };

            const ext = filePath.split('.').pop()?.toLowerCase() || '';
            const type = mimeTypes[ext] || 'application/octet-stream';

            this.currentResponse = new Response(file, { headers: { 'Content-Type': type }, status: 200 });
            return this.currentResponse;
        } catch (error) {
            console.error('Error reading file:', error);
            return this.status(500).send('Error reading file');
        }
    }

    type(contentType: string): this {
        if (this.currentResponse) {
            const headers = new Headers(this.currentResponse.headers);
            headers.set('Content-Type', contentType);
            this.currentResponse = new Response(this.currentResponse.body, {
                status: this.currentResponse.status,
                headers
            });
        } else {
            this.currentResponse = new Response(null, { status: 200, headers: { 'Content-Type': contentType } });
        }
        return this;
    }

    status(code: number): this {
        if (this.currentResponse) {
            this.currentResponse = new Response(this.currentResponse.body, {
                status: code,
                headers: this.currentResponse.headers
            });
        } else {
            this.currentResponse = new Response(null, { status: code });
        }
        return this;
    }

    cookie(name: string, value: string, options: CookieOptions = {}): this {
        const cookieOptions = [`${name}=${value}`];
        if (options.maxAge) cookieOptions.push(`Max-Age=${options.maxAge}`);
        if (options.domain) cookieOptions.push(`Domain=${options.domain}`);
        if (options.path) cookieOptions.push(`Path=${options.path}`);
        if (options.secure) cookieOptions.push('Secure');
        if (options.httpOnly) cookieOptions.push('HttpOnly');
        if (options.sameSite) cookieOptions.push(`SameSite=${options.sameSite}`);

        const headers = this.currentResponse ? new Headers(this.currentResponse.headers) : new Headers();
        headers.set('Set-Cookie', cookieOptions.join('; '));
        this.currentResponse = new Response(this.currentResponse?.body || null, {
            status: this.currentResponse?.status || 200,
            headers
        });
        return this;
    }

    redirect(url: string, statusCode: number = 302): Response {
        this.currentResponse = new Response(null, {
            status: statusCode,
            headers: { Location: url }
        });
        return this.currentResponse;
    }
}

export default ResponseHelper;
