export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  view_count: number;
  url: string;
}

export interface DownloadData {
  download_url: string;
  title: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" ? "/api" : "http://localhost:8000");

export const getInfo = async (url: string): Promise<VideoInfo> => {
  const response = await fetch(`${API_URL}/info?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch video info");
  }
  return response.json();
};

export const getDownloadUrl = async (url: string): Promise<DownloadData> => {
  const response = await fetch(`${API_URL}/download?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch download URL");
  }
  return response.json();
};
