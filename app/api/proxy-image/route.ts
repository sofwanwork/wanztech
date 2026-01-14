
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        // Validate URL domain for security
        const targetUrl = new URL(url);
        const allowedDomains = ['drive.google.com', 'lh3.googleusercontent.com', 'docs.google.com'];
        if (!allowedDomains.some(domain => targetUrl.hostname.endsWith(domain))) {
            return new NextResponse('Invalid domain', { status: 403 });
        }

        // Fetch the image
        const response = await fetch(url);
        if (!response.ok) {
            return new NextResponse(`Failed to user fetch image: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const buffer = await response.arrayBuffer();

        // Return the image
        return new NextResponse(Buffer.from(buffer), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Proxy Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
