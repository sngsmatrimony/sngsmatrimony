import { NextResponse } from 'next/server';

/**
 * API route to proxy documents (PDFs and images) from external sources (like S3)
 * to avoid CORS issues when processing for PDF generation.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const documentUrl = searchParams.get('url');

  if (!documentUrl) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  // Validate URL to prevent SSRF attacks - only allow specific domains
  try {
    const url = new URL(documentUrl);

    const isS3Url = url.hostname.endsWith('.amazonaws.com') ||
                    url.hostname.endsWith('.s3.amazonaws.com');
    const isSupabaseUrl = url.hostname.endsWith('.supabase.co') ||
                          url.hostname.includes('supabase.co');

    if (!isS3Url && !isSupabaseUrl) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(documentUrl, {
      headers: {
        'User-Agent': 'SNGS-Matrimonial-Document-Proxy/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch document: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Document proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}
