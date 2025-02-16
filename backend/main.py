from fastapi import FastAPI
import mysql_queries
import login



app = FastAPI()

app.include_router(login.router)

#修改CORS，允许所有的请求
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:55762"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Accept",
        "Authorization",
        "Origin",
        "X-Requested-With"
    ],
    expose_headers=["Set-Cookie"],
)

sql_connection = mysql_queries.connect()


@app.get("/")
def read_root():
    return {"Hello": "World"}
