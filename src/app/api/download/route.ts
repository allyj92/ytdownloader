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
    // 기본 클라이언트로 복귀하되 세션 로컬 생성 활성화
    const yt = await Innertube.create({
      generate_session_locally: true,
      cache: new UniversalCache(false)
    });

    // getBasicInfo로 라이브러리 내부 파싱 버그(null as) 우회
    const info = await yt.getBasicInfo(videoId);
    
    if (!info.streaming_data) {
      return NextResponse.json({ 
        error: 'YouTube blocked this server. This often happens on cloud platforms like Vercel.' 
      }, { status: 403 });
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
        error: 'No direct download link available. The video might be restricted.' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      downloadUrl: bestFormat.url,
      title: info.basic_info.title || 'video'
    });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ 
      error: `Server Side Error: ${error.message}. Try running the project locally for 100% success.` 
    }, { status: 500 });
  }
}
