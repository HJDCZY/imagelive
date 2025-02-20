from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from datetime import datetime, timedelta
import mysql_queries  
import time

router = APIRouter()


#使用OAuth2PasswordBearer类，jwt算法

#检查用户是否存在
def authenticate_user(username: str):
    query = "SELECT * FROM users WHERE name = %s"
    params = (username,)
    result = mysql_queries.query(mysql_queries.connection, query, params)
    if result:
        return True
    return False

    
#检查密码是否正确
def authenticate_password(username: str, password: str):
    query = "SELECT * FROM users WHERE name = %s AND password = %s"
    params = (username, password)
    result = mysql_queries.query(mysql_queries.connection, query, params)
    if result:
        return True
    return False

#生成token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, "secret", algorithm="HS256")
    return encoded_jwt


# 添加最后一次登录时间记录，防止暴力破解
last_login_attempt = {}  # 用户名: 最后登录时间

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 检查登录频率
    username = form_data.username.replace("'", "").replace('"', '').replace(';', '')
    current_time = time.time()
    
    if username in last_login_attempt:
        time_elapsed = current_time - last_login_attempt[username]
        if time_elapsed < 5:  # 如果距离上次登录不到1秒
            raise HTTPException(
                status_code=429, 
                detail=f"请求过于频繁，请等待 {5 - time_elapsed:.1f} 秒后重试"
            )
    
    # 更新最后登录时间
    last_login_attempt[username] = current_time
    
    #为了防止sql注入，我们过滤所有的单引号，双引号和分号
    form_data.username = form_data.username.replace("'", "").replace('"', '').replace(';', '')
    form_data.password = form_data.password.replace("'", "").replace('"', '').replace(';', '')
    print(form_data.username + " " + form_data.password)
    #检查用户是否存在
    if not authenticate_user(form_data.username):
        raise HTTPException(status_code=400, detail="用户不存在")
    #检查密码是否正确
    if not authenticate_password(form_data.username, form_data.password):
        raise HTTPException(status_code=400, detail="用户名或密码错误")
    #生成token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    response = JSONResponse(content={
        "access_token": access_token, 
        "token_type": "bearer",
        "username": form_data.username
    })
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="none",
        path="/",
        domain=None,  # 让浏览器自动设置域名
        secure=True,
        max_age=1800  # 30分钟过期
    )
    return response

@router.get("/check-login")
async def check_login(request: Request):
    # 打印所有请求头和 cookies，用于调试
    # print("Headers:", request.headers)
    # print("Cookies:", request.cookies)
    
    # 尝试获取 access_token 或 jwt cookie
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    print("Access Token:", access_token)
    
    # 检查 cookie 是否存在
    if access_token is None:
        raise HTTPException(status_code=401, detail="未登录")
        
    try:
        # 验证 JWT token
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        print("Decoded username:", username)
        
        if username is None:
            raise HTTPException(status_code=401, detail="无效的凭证")
            
        # 可选：验证用户是否仍然存在
        if not authenticate_user(username):
            raise HTTPException(status_code=401, detail="用户不存在")
            
        return {"username": username, "status": "authenticated"}
    except JWTError as e:
        print("JWT 解析错误:", str(e))
        raise HTTPException(status_code=401, detail="无效的凭证")
    

@router.get("/logout")
async def logout():
    response = JSONResponse(content={"status": "logged out"})
    response.delete_cookie(
        key="access_token",
        path="/",
        domain=None,  # 让浏览器自动设置域名
        secure=True,
        samesite="none"
    )
    return response

