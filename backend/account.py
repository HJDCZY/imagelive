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


async def get_user_auth(username: str):
    """内部函数：通过用户名获取权限"""
    query = "SELECT auth FROM users WHERE name = %s"
    params = (username,)
    result = mysql_queries.query(mysql_queries.connection, query, params)
    if result:
        return result[0][0]
    return None

@router.get("/getauth")
async def get_auth_endpoint(request: Request):
    """API端点：获取当前登录用户的权限"""
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
    try:
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        auth = await get_user_auth(username)
        if auth is not None:
            print(auth)
            return {"auth": auth}
        return {"error": "用户不存在"}
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    return {"error": "未知错误"}

class AuthChange(BaseModel):
    username: str
    newauth: str


@router.post("/changeAuth")
async def changeauth(request: Request, auth_data: AuthChange):
    #验证请求用户的权限时是否是管理员
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
    try:
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        auth = await get_user_auth(username)
        if auth is not None:
            if auth == "admin":
                #检查用户是否存在
                if not authenticate_user(auth_data.username):
                    raise HTTPException(status_code=400, detail="用户不存在")
                #更新权限
                query = "UPDATE users SET auth = %s WHERE name = %s"
                params = (auth_data.newauth, auth_data.username)
                result = mysql_queries.query(mysql_queries.connection, query, params)
                #展示sql报错
                
                if result:
                    return {"success": "权限修改成功"}
                raise HTTPException(status_code=400, detail="权限修改失败")
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    return {"error": "未知错误"}

#username的json格式
class Username(BaseModel):
    username: str

@router.post("/deleteUser")
async def deleteuser(request: Request, username_data: Username):
    # 验证请求用户的权限时是否是管理员
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
    try:
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        auth = await get_user_auth(username)
        if auth is not None:
            if auth == "admin":
                # 使用请求体中的用户名
                if not authenticate_user(username_data.username):
                    raise HTTPException(status_code=400, detail="用户不存在")
                
                # 首先更新所有相关表中的外键引用
                update_queries = [
                    "UPDATE photos SET uploader = 'testuser' WHERE uploader = %s",
                    "UPDATE activities SET creator = 'testuser' WHERE creator = %s",
                    # 如果还有其他表引用了users表，也需要添加相应的更新语句
                ]
                
                # 执行所有更新操作
                try:
                    for query in update_queries:
                        mysql_queries.query(mysql_queries.connection, query, (username_data.username,))
                    
                    # 最后删除用户
                    delete_query = "DELETE FROM users WHERE name = %s"
                    result = mysql_queries.query(mysql_queries.connection, delete_query, (username_data.username,))
                    
                    if result:
                        return {"success": "用户删除成功"}
                    raise HTTPException(status_code=400, detail="用户删除失败")
                except Exception as e:
                    print(f"删除用户时出错: {str(e)}")
                    raise HTTPException(status_code=400, detail=f"删除用户时出错: {str(e)}")
                    
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")


@router.get("/accountList")
async def accountList(request: Request):
    # 验证请求用户的权限是否是管理员
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
    try:
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        auth = await get_user_auth(username)
        if auth is not None:
            if auth == "admin":
                # 获取用户列表，排除系统用户
                query = """
                    SELECT name, auth FROM users 
                    WHERE name NOT IN ('testuser')
                    ORDER BY auth DESC, name ASC
                """
                result = mysql_queries.query(mysql_queries.connection, query)
                if result:
                    return {"users": result}
                return {"error": "获取用户列表失败"}
            raise HTTPException(status_code=400, detail="权限不足")
        return {"error": "用户不存在"}
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    return {"error": "未知错误"}


#body: JSON.stringify({ username, password, auth }),
class AddUser(BaseModel):
    username: str
    password: str
    auth: str

@router.post("/addUser")
async def adduser(request: Request):
    #验证请求用户的权限时是否是管理员
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
    try:
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        auth = await get_user_auth(username)
        if auth is not None:
            if auth == "admin":
                #获取请求参数
                user_data = await request.json()
                username = user_data["username"]
                password = user_data["password"]
                auth = user_data["auth"]
                #检查用户是否存在
                if authenticate_user(username):
                    raise HTTPException(status_code=400, detail="用户已存在")
                #添加用户
                query = "INSERT INTO users (name, password, auth) VALUES (%s, %s, %s)"
                params = (username, password, auth)
                result = mysql_queries.query(mysql_queries.connection, query, params)
                if result:
                    return {"success": "用户添加成功"}
                return {"error": "用户添加失败"}
            raise HTTPException(status_code=400, detail="权限不足")
        return {"error": "用户不存在"}
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    return {"error": "未知错误"}
