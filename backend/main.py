from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import io

app = FastAPI()

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "YouTube Downloader API is running"}

@app.get("/info")
async def get_info(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "uploader": info.get('uploader'),
                "view_count": info.get('view_count'),
                "url": url
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download")
async def download(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    # Get direct video URL or use yt-dlp to stream
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'quiet': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            download_url = info.get('url')
            # For simplicity, we just return the direct URL for now, or stream it.
            # But direct URL might expire. Let's redirect to it or use it in frontend.
            # If we want to hide the direct URL or handle it, we can stream.
            # However, streaming can be resource intensive.
            # Let's return the direct URL first to see if it works.
            return {"download_url": download_url, "title": info.get('title')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
