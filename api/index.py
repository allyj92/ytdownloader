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

def get_ydl_opts(is_info=True):
    opts = {
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'no_color': True,
        # 유튜브 전용 추출기 설정 강화
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'web', 'mweb'],
                'player_skip': ['webpage', 'configs'],
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.youtube.com/',
        }
    }

    if is_info:
        opts['format'] = 'best'
    else:
        opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'

    # 로컬 환경에서 크롬 쿠키 사용 시도 (401 에러 방지용)
    if not os.environ.get('VERCEL'):
        # 쿠키 읽기 실패 시 에러가 나지 않도록 설정
        opts['cookiefile'] = None # 초기화
        try:
            # 브라우저 쿠키 사용 시 401 Unauthorized를 방지하기 위해 사용
            opts['cookies_from_browser'] = 'chrome'
        except Exception:
            pass
            
    return opts

@app.get("/info")
async def get_info(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts(is_info=True)) as ydl:
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
        # 에러 메시지에 상세 내용 포함
        error_msg = str(e)
        if "401" in error_msg:
            error_msg = "YouTube login required or Cookies expired. Please check your browser login status."
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/download")
async def download(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts(is_info=False)) as ydl:
            info = ydl.extract_info(url, download=False)
            return {"download_url": info.get('url'), "title": info.get('title')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"status": "ok"}
