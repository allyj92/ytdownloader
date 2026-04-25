'use client';

import { useState } from 'react';
import { Download, Video, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const fetchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setDownloading(false);

    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch video info');
      }

      setVideoInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;
    
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch(`/api/download?id=${videoInfo.id}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Download failed');
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${videoInfo.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-200">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
            YouTube Downloader
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Download your favorite YouTube videos in MP4 format instantly.
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 p-6 mb-8 border border-slate-100">
          <form onSubmit={fetchInfo} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Paste YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Analyze</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Video Preview */}
        {videoInfo && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full h-full object-cover aspect-video"
                />
              </div>
              <div className="p-8 md:w-1/2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-green-600 mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Ready to download</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                    {videoInfo.title}
                  </h2>
                  <p className="text-sm text-slate-500 mb-4">{videoInfo.author}</p>
                  <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                    MP4 • Best Quality
                  </div>
                </div>
                
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-6 w-full py-4 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-300"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center text-slate-400 text-sm italic">
          Please respect the rights of content creators. Use this tool for personal use only.
        </div>
      </div>
    </main>
  );
}
