#账号相关
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from datetime import datetime, timedelta
import mysql_queries  
from login import authenticate_user, authenticate_password, create_access_token

router = APIRouter()
from pydantic import BaseModel
# 添加请求体模型
class PasswordChange(BaseModel):
    oldPassword: str
    newPassword: str

@router.post("/change-password")
async def change_password(request: Request, password_data: PasswordChange):
    #为了防止sql注入，我们过滤所有的单引号，双引号和分号
    new_password = password_data.newPassword.replace("'", "").replace('"', '').replace(';', '')
    old_password = password_data.oldPassword.replace("'", "").replace('"', '').replace(';', '')
    
    #检查cookie是否存在
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
        
    #通过jwt解析cookie，获取用户名
    try:
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        # print(username)
        # print(new_password)
        # print(old_password)
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    #检查用户是否存在
    if not authenticate_user(username):
        raise HTTPException(status_code=400, detail="用户不存在")
    #检查密码是否正确
    if not authenticate_password(username, old_password):
        raise HTTPException(status_code=400, detail="原密码错误")
    #更新密码
    query = "UPDATE users SET password = %s WHERE name = %s"

    params = (new_password, payload["sub"])
    result = mysql_queries.query(mysql_queries.connection, query, params)
    if result:
        return {"success": "密码修改成功"}
    return {"error": "密码修改失败"}

    