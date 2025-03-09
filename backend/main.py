from fastapi import FastAPI
import mysql_queries
import login
import account
import activity
import imageupload
import imagedownload
import imagemanage
import index
import facescan
from config import config


app = FastAPI()

app.include_router(login.router)
app.include_router(account.router)
app.include_router(activity.router)
app.include_router(imageupload.router)
app.include_router(imagedownload.router)
app.include_router(imagemanage.router)
app.include_router(index.router)
app.include_router(facescan.router)

#修改CORS，允许所有的请求
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        config["frontlocation"],
        config["location"],
        "http://localhost",
        "https://localhost",
        config["frontlocation2"],
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Accept",
        "Authorization",
        "Origin",
        "X-Requested-With",
        "Cookie",
        "isYouABrowser",
        "Access-Control-Allow-Origin",
        "Set-Cookie",
        "Cache-Control",
        "Pragma",
    ],
    max_age=3600,
)


sql_connection = mysql_queries.connect()


@app.get("/")
def read_root():
    return {"Hello": "World"}
