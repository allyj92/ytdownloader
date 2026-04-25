import { Innertube, UniversalCache } from 'youtubei.js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // 최소한의 설정으로 세션 생성
    const yt = await Innertube.create({
      generate_session_locally: true,
      client_type: 'ANDROID_VR' as any // 차단이 적은 클라이언트 시도
    });

    // getInfo 대신 getBasicInfo를 사용하여 내부 파서 에러(as of null) 우회 시도
    const info = await yt.getBasicInfo(videoId);
    
    // 스트리밍 데이터 직접 확인
    if (!info.streaming_data) {
      throw new Error('Streaming data is missing. YouTube might be blocking this request.');
    }

    // 포맷 수동 추출 (비디오+오디오 통합 포맷 중 가장 해상도가 높은 것)
    const formats = [
      ...(info.streaming_data.formats || []),
      ...(info.streaming_data.adaptive_formats || [])
    ];

    // 통합 포맷(video+audio) 우선 탐색
    const bestFormat = formats
      .filter(f => f.has_video && f.has_audio)
      .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

    if (!bestFormat || !bestFormat.url) {
      return NextResponse.json({ 
        error: 'Could not find a direct download link for this video. It might be protected.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      downloadUrl: bestFormat.url,
      title: info.basic_info.title || 'video'
    });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ 
      error: `YouTube Blocked or Library Error: ${error.message}` 
    }, { status: 500 });
  }
}
