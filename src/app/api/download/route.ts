import { Innertube, UniversalCache } from 'youtubei.js';
import { NextRequest } from 'next/server';

// Vercel Edge Runtime 설정 (4.5MB 제한 우회 및 스트리밍 최적화)
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return new Response('Video ID is required', { status: 400 });
  }

  try {
    const yt = await Innertube.create({
      generate_session_locally: true,
      client_type: 'ANDROID' as any,
    });

    const info = await yt.getBasicInfo(videoId);
    
    if (info.playability_status?.status === 'UNPLAYABLE') {
      return new Response(`YouTube Blocked: ${info.playability_status.reason}`, { status: 403 });
    }

    const streamingData = info.streaming_data;
    if (!streamingData) {
      return new Response('YouTube withheld streaming data on this server IP.', { status: 403 });
    }

    const allFormats = [
      ...(streamingData.formats || []),
      ...(streamingData.adaptive_formats || [])
    ];

    const bestFormat = allFormats
      .filter(f => f.has_video && f.has_audio && f.url)
      .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

    if (!bestFormat || !bestFormat.url) {
      return new Response('No downloadable format found on this server.', { status: 404 });
    }

    // 유튜브 서버로부터 스트림 직접 중계
    const videoResponse = await fetch(bestFormat.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0',
        'Referer': 'https://www.youtube.com/',
      }
    });

    if (!videoResponse.ok) {
      return new Response(`YouTube Rejected: ${videoResponse.status}`, { status: videoResponse.status });
    }

    const responseHeaders = new Headers();
    const safeTitle = encodeURIComponent(info.basic_info.title || 'video');
    
    responseHeaders.set('Content-Type', 'video/mp4');
    responseHeaders.set('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    if (bestFormat.content_length) {
      responseHeaders.set('Content-Length', bestFormat.content_length.toString());
    }

    // Edge Runtime은 스트림을 매우 효율적으로 처리합니다.
    return new Response(videoResponse.body, {
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('Final Vercel Error:', error);
    return new Response(`Server Error: ${error.message}`, { status: 500 });
  }
}
