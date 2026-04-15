from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모든 에러를 JSON으로 변환하여 반환하도록 예외 핸들러 등록
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": "global_error"},
    )

def get_ydl_opts():
    opts = {
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        }
    }
    if not os.environ.get('VERCEL'):
        try:
            opts['cookies_from_browser'] = 'chrome'
        except Exception as e:
            logger.warning(f"Cookies load failed: {e}")
    return opts

@app.get("/info")
@app.get("/api/info")
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
        logger.error(f"Error in info: {str(e)}")
        # 여기서 HTTPException을 발생시키면 FastAPI가 자동으로 JSON으로 변환해줍니다.
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download")
@app.get("/api/download")
async def download(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        with yt_dlp.YoutubeDL(get_ydl_opts()) as ydl:
            info = ydl.extract_info(url, download=False)
            return {"download_url": info.get('url'), "title": info.get('title')}
    except Exception as e:
        logger.error(f"Error in download: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
@app.get("/api")
async def root():
    return {"status": "ok", "environment": "local" if not os.environ.get('VERCEL') else "vercel"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
