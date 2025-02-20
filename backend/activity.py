from fastapi import FastAPI
import mysql_queries
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from account import get_user_auth
from jose import JWTError, jwt


router = APIRouter()    

@router.get("/getActivities")
async def getActivities(request: Request):
    # 确认请求用户有contributer或者admin的权限
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
    try:
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        auth = await get_user_auth(username)
        if auth is not None:
            if auth == "contributer" or auth == "admin":
                query = "SELECT name ,label ,date ,location,likes,shares FROM activities"
                result = mysql_queries.query(mysql_queries.connection, query)
                if result:
                    return {"activities": result}
                raise HTTPException(status_code=400, detail="获取活动列表失败")
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    return {"error": "未知错误"}


@router.post("/updateActivity")
async def update_activity(request: Request):
    # 确认请求用户有contributer或者admin的权限
    access_token = request.cookies.get("access_token") or request.cookies.get("jwt")
    if access_token is None:
        raise HTTPException(status_code=400, detail="未登录")
    try:
        # 验证权限
        payload = jwt.decode(access_token, "secret", algorithms=["HS256"])
        username: str = payload.get("sub")
        auth = await get_user_auth(username)
        if auth is not None:
            if auth == "contributer" or auth == "admin":
                data = await request.json()
                field = data.get('field')
                value = data.get('value')
                activity_id = data.get('id')

                # 添加 updated_at 字段的更新
                query = f"UPDATE activities SET {field} = %s, updated_at = CURRENT_TIMESTAMP WHERE name = %s"
                try:
                    result = mysql_queries.query(mysql_queries.connection, query, (value, activity_id))
                    if result:
                        return {"success": True}
                    raise HTTPException(status_code=400, detail="更新失败")
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")