import { Innertube } from 'youtubei.js';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return new Response('Video ID is required', { status: 400 });
  }

  try {
    const yt = await Innertube.create();
    const info = await yt.getInfo(videoId);
    
    // Attempt to get the best quality format that has both video and audio
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    
    if (!format) {
      return new Response('No suitable format found', { status: 404 });
    }

    const stream = await info.download(format.itag);
    
    // We need to return a Response with the stream.
    // In Node.js environment, we might need to convert the stream if it's not a Web Stream.
    // Innertube's download returns a stream that should be compatible with Response.
    
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'video/mp4');
    responseHeaders.set('Content-Disposition', `attachment; filename="${encodeURIComponent(info.basic_info.title || 'video')}.mp4"`);

    return new Response(stream as any, {
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return new Response(error.message || 'Failed to download video', { status: 500 });
  }
}
