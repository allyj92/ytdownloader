import { Innertube } from 'youtubei.js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const yt = await Innertube.create({
      generate_session_locally: true,
      client_type: 'ANDROID' as any
    });
    
    let videoId = '';
    try {
      if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('shorts/')) {
        videoId = url.split('shorts/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      }
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse YouTube URL' }, { status: 400 });
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const info = await yt.getBasicInfo(videoId);

    const basicInfo = {
      id: info.basic_info.id,
      title: info.basic_info.title,
      thumbnail: info.basic_info.thumbnail?.[0]?.url,
      duration: info.basic_info.duration,
      author: info.basic_info.author,
    };

    return NextResponse.json(basicInfo);
  } catch (error: any) {
    console.error('Error fetching info:', error);
    return NextResponse.json({ error: `Analysis Error: ${error.message}` }, { status: 500 });
  }
}
