"use client";

import React, { useState } from "react";
import { VideoInfo, getDownloadUrl } from "@/lib/api";

interface VideoCardProps {
  info: VideoInfo;
}

const VideoCard: React.FC<VideoCardProps> = ({ info }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { download_url } = await getDownloadUrl(info.url);
      
      // Open in new tab or trigger browser download
      const link = document.createElement("a");
      link.href = download_url;
      link.target = "_blank";
      link.download = `${info.title}.mp4`; // Note: browser might not respect download name on direct link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to get download link. " + (err as Error).message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-white text-black shadow-xl rounded-2xl overflow-hidden flex flex-col md:flex-row transition-transform hover:scale-[1.01]">
      <div className="md:w-1/2 relative group">
        <img
          src={info.thumbnail}
          alt={info.title}
          className="w-full h-full object-cover aspect-video"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md font-medium">
          {formatDuration(info.duration)}
        </div>
      </div>
      <div className="md:w-1/2 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold line-clamp-2 leading-tight mb-2">{info.title}</h2>
          <p className="text-gray-600 text-sm font-medium">{info.uploader}</p>
          <p className="text-gray-400 text-xs mt-1">
            {info.view_count.toLocaleString()} views
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`mt-4 w-full p-3 font-bold text-white rounded-xl shadow-lg transition-all ${
            isDownloading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 active:scale-95"
          }`}
        >
          {isDownloading ? "Getting Link..." : "Download mp4"}
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
