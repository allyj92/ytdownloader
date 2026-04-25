import { Innertube, UniversalCache } from 'youtubei.js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // 가장 우회 성능이 좋은 iOS 클라이언트로 설정
    const yt = await Innertube.create({
      generate_session_locally: true,
      retrieve_player: true,
      client_type: 'IOS' as any
    });

    // 상세 파싱 과정에서 발생하는 null 에러를 방지하기 위해 getBasicInfo 사용
    const info = await yt.getBasicInfo(videoId);
    
    if (!info.streaming_data) {
      // 만약 데이터센터 IP가 완전히 차단된 경우 여기에 도달합니다.
      throw new Error('YouTube blocked this server IP. Please try again later or run locally.');
    }

    const formats = [
      ...(info.streaming_data.formats || []),
      ...(info.streaming_data.adaptive_formats || [])
    ];

    // 비디오+오디오 통합 포맷 중 가장 좋은 것 선택
    const bestFormat = formats
      .filter(f => f.has_video && f.has_audio)
      .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

    if (!bestFormat || !bestFormat.url) {
      return NextResponse.json({ 
        error: 'This video requires a signature bypass that is currently blocked on this server.' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      downloadUrl: bestFormat.url,
      title: info.basic_info.title || 'video'
    });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ 
      error: `YouTube Block: ${error.message}` 
    }, { status: 500 });
  }
}
