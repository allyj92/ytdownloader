import { Innertube, UniversalCache } from 'youtubei.js';
import { NextRequest } from 'next/server';

export const maxDuration = 60; // Vercel timeout 확장 (Hobby는 최대 10-60초)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return new Response('Video ID is required', { status: 400 });
  }

  try {
    // 캐시를 사용하여 세션 유지 시도
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      client_type: 'TVHTML5_SIMPLY' as any
    });

    const info = await yt.getInfo(videoId);
    
    // 포맷 선택 (비디오+오디오 통합 포맷 중 가장 좋은 것)
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    
    if (!format) {
      return new Response('No suitable video+audio format found', { status: 404 });
    }

    // 직접 URL 추출
    const videoUrl = format.url;
    if (!videoUrl) {
      return new Response('Could not extract video URL', { status: 500 });
    }

    // 유튜브 서버로부터 데이터 가져오기 (Proxy)
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
      }
    });

    if (!videoResponse.ok) {
      return new Response(`Failed to fetch from YouTube: ${videoResponse.statusText}`, { status: videoResponse.status });
    }

    // 클라이언트에 스트림 전달
    const responseHeaders = new Headers();
    const title = info.basic_info.title || 'video';
    const safeTitle = encodeURIComponent(title).replace(/%20/g, ' ');
    
    responseHeaders.set('Content-Type', 'video/mp4');
    responseHeaders.set('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    // 가능하면 파일 크기 전달
    if (format.content_length) {
      responseHeaders.set('Content-Length', format.content_length.toString());
    }

    return new Response(videoResponse.body, {
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return new Response(`Server Error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
}
