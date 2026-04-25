import { Innertube, UniversalCache } from 'youtubei.js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      client_type: 'TVHTML5_SIMPLY' as any
    });

    const info = await yt.getInfo(videoId);
    
    // 비디오+오디오 통합 포맷 중 가장 좋은 것 선택
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    
    if (!format || !format.url) {
      return NextResponse.json({ error: 'Download URL not found for this video' }, { status: 404 });
    }

    // 파일 데이터를 보내는 대신, 유튜브의 직접 스트리밍 URL을 반환
    return NextResponse.json({ 
      downloadUrl: format.url,
      title: info.basic_info.title
    });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: `Server Side Error: ${error.message}` }, { status: 500 });
  }
}
