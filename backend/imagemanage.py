from fastapi import APIRouter, Request, HTTPException
from jose import JWTError, jwt
from config import config
import mysql_queries
from account import get_user_auth
import os
from pydantic import BaseModel

router = APIRouter()

class ImageApproval(BaseModel):
    id: int
    approved: bool

@router.post("/approveImage")
async def approve_image(request: Request, image_data: ImageApproval):
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
                # 检查当前状态
                check_query = "SELECT state FROM photos WHERE id = %s"
                check_params = (image_data.id,)
                current_state = mysql_queries.query(mysql_queries.connection, check_query, check_params)
                
                if not current_state:
                    raise HTTPException(status_code=400, detail="图片不存在")
                
                current_state = current_state[0][0]  # 获取查询结果中的状态值
                new_state = "approved" if image_data.approved else "rejected"
                
                # 如果状态相同，直接返回成功
                if current_state == new_state:
                    return {"success": True}
                
                # 状态不同时才更新数据库
                query = "UPDATE photos SET state = %s, reviewer = %s WHERE id = %s"
                params = (new_state, username, image_data.id)
                result = mysql_queries.query(mysql_queries.connection, query, params)
                
                if result:
                    return {"success": True}
                raise HTTPException(status_code=400, detail="更新失败")
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    return {"error": "未知错误"}

class ImageDeletion(BaseModel):
    id: int

@router.post("/deleteImage")
async def delete_image(request: Request , image_data: ImageDeletion):
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
                # 删除数据库中的图片
                query = "DELETE FROM photos WHERE id = %s"
                params = (image_data.id,)
                result = mysql_queries.query(mysql_queries.connection, query, params)
                if result:
                    # 删除原始图片文件
                    jpg_path = os.path.join(config['imagefolder'], f"{image_data.id}.jpg")
                    png_path = os.path.join(config['imagefolder'], f"{image_data.id}.png")
                    # 删除缩略图
                    thumb_path = os.path.join(config['thumbnailfolder'], f"{image_data.id}.webp")
                    
                    # 删除文件如果存在
                    for path in [jpg_path, png_path, thumb_path]:
                        try:
                            if os.path.exists(path):
                                os.remove(path)
                        except Exception as e:
                            print(f"删除文件 {path} 时出错: {str(e)}")
                            continue
                    
                    return {"success": True}
                raise HTTPException(status_code=400, detail="删除失败")
            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    return {"error": "未知错误"}