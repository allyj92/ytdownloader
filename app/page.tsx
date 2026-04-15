"use client";

import { useState } from "react";
import UrlForm from "@/components/UrlForm";
import VideoCard from "@/components/VideoCard";
import { getInfo, VideoInfo } from "@/lib/api";

export default function Home() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInfoFetch = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setVideoInfo(null);
    try {
      const info = await getInfo(url);
      setVideoInfo(info);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-5xl font-extrabold text-red-600 mb-4 tracking-tight">
          YouTube Downloader
        </h1>
        <p className="text-gray-600 text-lg font-medium">
          Simple. Fast. High Quality.
        </p>
      </div>

      <UrlForm onInfoFetched={handleInfoFetch} isLoading={isLoading} />

      {error && (
        <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg max-w-2xl w-full text-center font-bold border-2 border-red-200">
          {error}
        </div>
      )}

      {videoInfo && <VideoCard info={videoInfo} />}

      <footer className="mt-auto pt-12 text-gray-400 text-sm font-medium">
        Built with Next.js & FastAPI
      </footer>
    </main>
  );
}
