import mysql_queries
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from account import get_user_auth
from jose import JWTError, jwt
import os
from config import config
#传文件
from fastapi import File, UploadFile

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
                query = "SELECT name, label, date, location, likes, shares FROM activities"
                result = mysql_queries.query(mysql_queries.connection, query)
                # 移除错误检查，直接返回结果（如果没有数据则返回空列表）
                return {"activities": result if result else []}
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")


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
    


from fastapi import Form, File, UploadFile
import json

@router.post("/addActivity")
async def add_activity(
    request: Request,
    cover: UploadFile = File(None),
    name: str = Form(...),
    label: str = Form(...),
    date: str = Form(...),
    location: str = Form(...),
    likes: int = Form(0),
    shares: int = Form(0)
):
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
                # 向数据库插入活动数据
                query = "INSERT INTO activities (name, label, date, location, likes, shares) VALUES (%s, %s, %s, %s, %s, %s)"
                try:
                    result = mysql_queries.query(
                        mysql_queries.connection, 
                        query, 
                        (name, label, date, location, likes, shares)
                    )
                    
                    if result:
                        # 如果有上传封面图片，保存图片
                        if cover:
                            # 获取文件扩展名
                            file_extension = os.path.splitext(cover.filename)[1]
                            # 使用活动名称作为文件名，'headimagefolder'
                            file_path = os.path.join(config['headimagefolder'], f"{name}{file_extension}")
                            
                            # 保存文件
                            try:
                                with open(file_path, "wb") as buffer:
                                    content = await cover.read()
                                    buffer.write(content)
                                
                            except Exception as e:
                                # 如果保存图片失败，记录错误但不影响活动创建
                                print(f"保存封面图片失败: {str(e)}")
                                
                        return {"success": True}
                    raise HTTPException(status_code=400, detail="添加失败")
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
                    

@router.post("/deleteActivity")
async def delete_activity(request: Request):
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
                # 删除数据库中的数据，以name字段为准
                name = data.get('name')
                #删除活动时删除所有此活动的照片
                #照片在config['imagefolder']文件夹下，文件名为id.png或者id.jpg，此处的id是数据库photos表中的id字段
                
                #获得所有此活动的照片的id
                query = "SELECT id FROM photos WHERE activity_name = %s"
                try:
                    result = mysql_queries.query(mysql_queries.connection, query, (name,))
                    if result:#如果有照片需要删除
                        for photo in result:
                            photo_id = str(photo[0])
                            file_paths = [
                                os.path.join(config['imagefolder'], photo_id + ext)
                                for ext in ['.png', '.jpg']
                            ]
                            
                            for path in file_paths:
                                if os.path.exists(path):
                                    try:
                                        os.remove(path)
                                        break  # 找到并删除文件后就跳出内层循环
                                    except Exception as e:
                                        print(f"删除文件 {path} 失败: {str(e)}")
                                        continue  # 继续尝试其他扩展名的文件
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"删除照片失败: {str(e)}")
                
                #删除封面图，可能是jpg或者png
                file_paths = [
                    os.path.join(config['headimagefolder'], name + ext)
                    for ext in ['.png', '.jpg']
                ]
                for path in file_paths:
                    if os.path.exists(path):
                        try:
                            os.remove(path)
                            break  # 找到并删除文件后就跳出内层循环
                        except Exception as e:
                            print(f"删除文件 {path} 失败: {str(e)}")
                            continue
                
                #删除数据库中的活动
                query = "DELETE FROM activities WHERE name = %s"
                try:
                    result = mysql_queries.query(mysql_queries.connection, query, (name,))
                    if result:
                        return {"success": True}
                    raise HTTPException(status_code=400, detail="删除失败")
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    
                    
                    
                
                