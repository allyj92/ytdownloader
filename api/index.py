from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_ydl_opts():
    opts = {
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'no_color': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'android', 'web'],
                'player_skip': ['webpage', 'configs'],
            }
        },
        'http_headers': {
            'User-Agent': 'com.google.ios.youtube/19.08.2 (iPhone16,2; U; CPU iOS 17_4 like Mac OS X; en_US)',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
        }
    }
    if not os.environ.get('VERCEL'):
        try:
            opts['cookies_from_browser'] = 'chrome'
        except:
            pass
    return opts

# /api/info와 /info 둘 다 대응
@app.get("/api/info")
@app.get("/info")
async def get_info(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts()) as ydl:
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

# /api/download와 /download 둘 다 대응
@app.get("/api/download")
@app.get("/download")
async def download(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts()) as ydl:
            info = ydl.extract_info(url, download=False)
            return {"download_url": info.get('url'), "title": info.get('title')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api")
@app.get("/")
async def root():
    return {"status": "ok", "message": "API is running"}
