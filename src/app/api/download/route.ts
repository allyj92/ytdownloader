import { Innertube } from 'youtubei.js';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return new Response('Video ID is required', { status: 400 });
  }

  try {
    const yt = await Innertube.create({
      generate_session_locally: true,
      retrieve_player: true,
      client_type: 'ANDROID' as any
    });
    const info = await yt.getInfo(videoId);
    
    // Check if video is playable
    if (info.playability_status?.status !== 'OK') {
      return new Response(`Video is not playable: ${info.playability_status?.reason || 'Unknown reason'}`, { status: 403 });
    }

    // Attempt to get the best quality format that has both video and audio
    const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    
    if (!format) {
      return new Response('No suitable format found', { status: 404 });
    }

    const stream = await info.download({
      itag: format.itag
    });
    
    if (!stream) {
      return new Response('Failed to generate download stream', { status: 500 });
    }

    const responseHeaders = new Headers();
    const fileName = info.basic_info.title ? encodeURIComponent(info.basic_info.title) : 'video';
    responseHeaders.set('Content-Type', 'video/mp4');
    responseHeaders.set('Content-Disposition', `attachment; filename="${fileName}.mp4"`);

    // Ensure the stream is treated correctly as a body
    return new Response(stream as ReadableStream, {
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return new Response(error.message || 'Failed to download video', { status: 500 });
  }
}
