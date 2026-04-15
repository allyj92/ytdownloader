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

// Vercel 환경인지 로컬 환경인지에 따라 API 주소 설정
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const getInfo = async (url: string): Promise<VideoInfo> => {
  const response = await fetch(`${API_URL}/info?url=${encodeURIComponent(url)}`);
  
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch video info");
    } else {
      // JSON이 아닌 텍스트 에러가 올 경우 (500 Internal Server Error 등)
      const text = await response.text();
      throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
    }
  }
  
  return response.json();
};

export const getDownloadUrl = async (url: string): Promise<DownloadData> => {
  const response = await fetch(`${API_URL}/download?url=${encodeURIComponent(url)}`);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Download Link Error (${response.status}): ${text.substring(0, 100)}...`);
  }
  
  return response.json();
};
