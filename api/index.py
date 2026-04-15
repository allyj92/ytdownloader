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
    # 봇 감지 우회를 위한 최신 추출기 옵션
    opts = {
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'no_color': True,
        # 유튜브의 최신 보안 정책을 우회하기 위한 클라이언트 설정
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

    # 로컬 환경(Windows 등)에서 실행 시 본인 브라우저 쿠키 자동 로드
    if not os.environ.get('VERCEL'):
        try:
            # 크롬 브라우저의 로그인 정보를 활용하여 100% 우회 시도
            opts['cookies_from_browser'] = 'chrome'
        except:
            pass
            
    return opts

@app.get("/api/info")
async def get_info(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts()) as ydl:
            # extract_info 호출 시 download=False로 메타데이터만 추출
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
        # 에러 발생 시 상세 메시지 반환
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download")
async def download(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts()) as ydl:
            info = ydl.extract_info(url, download=False)
            # 스트리밍 가능한 직접 URL 반환
            return {"download_url": info.get('url'), "title": info.get('title')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api")
async def root():
    return {"status": "ok", "message": "YouTube Downloader API is ready"}
