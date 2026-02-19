// Image proxy to bypass CDN hotlink protection (e.g. cdn.qwenlm.ai 403)
export const runtime = 'edge';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*',
                'Referer': new URL(imageUrl).origin + '/',
            },
        });

        if (!response.ok) {
            return new Response(`Upstream error: ${response.status}`, { status: response.statusText ? 502 : response.status });
        }

        const contentType = response.headers.get('content-type') || 'image/png';
        const imageData = await response.arrayBuffer();

        return new Response(imageData, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
}
