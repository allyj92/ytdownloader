import { Innertube, UniversalCache } from 'youtubei.js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // 모바일 웹(MWEB) 클라이언트로 위장하여 차단 우회 시도
    const yt = await Innertube.create({
      generate_session_locally: true,
      client_type: 'MWEB' as any
    });

    const info = await yt.getBasicInfo(videoId);
    
    if (!info.streaming_data) {
      throw new Error('Streaming data is hidden by YouTube (IP Blocked)');
    }

    const formats = [
      ...(info.streaming_data.formats || []),
      ...(info.streaming_data.adaptive_formats || [])
    ];

    // 비디오+오디오 통합 포맷 중 가장 해상도가 높은 것 선택
    const bestFormat = formats
      .filter(f => f.has_video && f.has_audio)
      .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

    if (!bestFormat || !bestFormat.url) {
      return NextResponse.json({ 
        error: 'YouTube is protecting this video from server-side extraction.' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      downloadUrl: bestFormat.url,
      title: info.basic_info.title || 'video'
    });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ 
      error: `YouTube Blocked: ${error.message}. Vercel IPs are often restricted. Try a different video or run locally.` 
    }, { status: 500 });
  }
}
