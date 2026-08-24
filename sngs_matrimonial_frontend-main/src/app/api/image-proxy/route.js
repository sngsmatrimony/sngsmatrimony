import { NextResponse } from 'next/server';

/**
 * API route to proxy images from external sources (like S3) to avoid CORS issues
 * when using html2canvas for PDF generation.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  // Validate URL to prevent SSRF attacks - only allow specific domains
  try {
    const url = new URL(imageUrl);
    const allowedHosts = [
      'sngs-matrimonial.s3.amazonaws.com',
      's3.amazonaws.com',
      'sngs-matrimonial.s3.ap-south-1.amazonaws.com',
      's3.ap-south-1.amazonaws.com',
      'supabase.co',
      'storage.supabase.co',
      '*.supabase.co',
    ];

    const isS3Url = url.hostname.endsWith('.amazonaws.com') ||
                    url.hostname.endsWith('.s3.amazonaws.com');
    const isSupabaseUrl = url.hostname.endsWith('.supabase.co') ||
                          url.hostname.includes('supabase.co');

    if (!isS3Url && !isSupabaseUrl && !allowedHosts.includes(url.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'SNGS-Matrimonial-Image-Proxy/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
