from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel이 /api 경로를 이 파일로 라우팅하므로, 여기서는 그 하위 경로만 정의합니다.
@app.get("/info")
async def get_info(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    ydl_opts = {'quiet': True, 'no_warnings': True}
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
    ydl_opts = {'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', 'quiet': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {"download_url": info.get('url'), "title": info.get('title')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check용
@app.get("/")
async def root():
    return {"status": "ok"}
