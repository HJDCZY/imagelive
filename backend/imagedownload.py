import mysql_queries
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from account import get_user_auth
from jose import JWTError, jwt
from config import config
import os
from fastapi.responses import FileResponse  # 添加这行

router = APIRouter()

@router.get("/getImagesBackend")
async def get_images_backend(request: Request):
    #这个是给后台单独写的，因为后台需要获取所有的图片，观众端只需要获取通过审核的图片
    # 提取请求体当中的SelectedActivity
    selected_activity = request.query_params.get("selectedActivity")

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
            print(auth)
            if auth == "contributer" or auth == "admin":
                # 查询数据库
                query = "SELECT * FROM photos WHERE activity_name = %s"
                result = mysql_queries.query(mysql_queries.connection, query, (selected_activity,))
                
                #从config['imagefolder']查询id.png或者是id.jpg的文件，并且将一系列文件返回给前端，不区分审核状态
                # 首先返回路径，之后再写一个接口，根据路径返回图片
                if result:
                    images = []
                    for photo in result:
                        photo_id = str(photo[0])
                        # 检查文件是否存在
                        jpg_path = os.path.join(config['imagefolder'], f"{photo_id}.jpg")
                        png_path = os.path.join(config['imagefolder'], f"{photo_id}.png")
                        
                        file_url = None
                        if os.path.exists(jpg_path):
                            file_url = f"/thumbnail/{photo_id}"
                        elif os.path.exists(png_path):
                            file_url = f"/thumbnail/{photo_id}"
                        
                        if file_url:
                            images.append({
                                'id': photo_id,
                                'url': file_url,
                                'upload_time': photo[2].strftime("%Y-%m-%d %H:%M:%S"),
                                'uploader': photo[3],
                                'state': photo[4],
                                'likes': photo[5],
                                'reviewer': photo[6],

                            })
                    
                    return {"success": True, "images": images}
            else:
                raise HTTPException(status_code=400, detail="权限不足")
        else:
            raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    

@router.get("/getImagesFrontend/{selectedActivity}")
async def get_images_frontend(selectedActivity: str):

    # 查询数据库
    query = "SELECT * FROM photos WHERE activity_name = %s AND state = 'approved'"
    result = mysql_queries.query(mysql_queries.connection, query, (selectedActivity,))
    
    #从config['imagefolder']查询id.png或者是id.jpg的文件，并且将一系列文件返回给前端，只返回审核通过的图片
    # 首先返回路径，之后再写一个接口，根据路径返回图片
    if result:
        images = []
        for photo in result:
            photo_id = str(photo[0])
            # 检查文件是否存在
            jpg_path = os.path.join(config['imagefolder'], f"{photo_id}.jpg")
            png_path = os.path.join(config['imagefolder'], f"{photo_id}.png")
            
            file_url = None
            if os.path.exists(jpg_path):
                file_url = f"/thumbnail/{photo_id}"
            elif os.path.exists(png_path):
                file_url = f"/thumbnail/{photo_id}"
            
            if file_url:
                images.append({
                    'id': photo_id,
                    'url': file_url,
                    'upload_time': photo[2].strftime("%Y-%m-%d %H:%M:%S"),
                    'uploader': photo[3],
                    'state': photo[4],
                    'likes': photo[5],
                    'reviewer': photo[6],

                })
            
        return {"success": True, "images": images}
    else:
        return {"success": False, "images": []}
    
                    
            
@router.get("/image/{photo_id}")
async def get_image(photo_id: str):
    # 如果photo_id已经包含扩展名，先移除它
    photo_id = photo_id.split('.')[0]  # 移除可能存在的扩展名
    
    # 返回图片
    jpg_path = os.path.join(config['imagefolder'], f"{photo_id}.jpg")
    png_path = os.path.join(config['imagefolder'], f"{photo_id}.png")
    
    if os.path.exists(jpg_path):
        return FileResponse(jpg_path)
    elif os.path.exists(png_path):
        return FileResponse(png_path)
    raise HTTPException(status_code=404, detail="图片不存在")

@router.get("/imagedownload/{photo_id}")
async def get_image(photo_id: str):
    # 如果photo_id已经包含扩展名，先移除它
    photo_id = photo_id.split('.')[0]  # 移除可能存在的扩展名
    
    # 返回图片
    jpg_path = os.path.join(config['imagefolder'], f"{photo_id}.jpg")
    png_path = os.path.join(config['imagefolder'], f"{photo_id}.png")
    
    if os.path.exists(jpg_path):
        return FileResponse(
            jpg_path,
            headers={
                "Content-Disposition": f'attachment; filename="{photo_id}.jpg"'
            }
        )
    elif os.path.exists(png_path):
        return FileResponse(
            png_path,
            headers={
                "Content-Disposition": f'attachment; filename="{photo_id}.png"'
            }
        )
    raise HTTPException(status_code=404, detail="图片不存在")


@router.get("/thumbnail/{photo_id}")
async def get_thumbnail(photo_id: str):
    # 如果photo_id已经包含扩展名，先移除它
    photo_id = photo_id.split('.')[0]

    # 返回缩略图
    thumb_path = os.path.join(config['thumbnailfolder'], f"{photo_id}.webp")
    if os.path.exists(thumb_path):
        return FileResponse(thumb_path)
    raise HTTPException(status_code=404, detail="缩略图不存在")



@router.get("/getCoverImage")
async def get_cover_image(request: Request):
    # 提取请求体当中的SelectedActivity
    selected_activity = request.query_params.get("selectedActivity")
    # 直接去'headimagefolder'文件夹下找selectedActivity.png或者selectedActivity.jpg
    # 如果找到就返回，找不到就返回404
    jpg_path = os.path.join(config['headimagefolder'], f"{selected_activity}.jpg")
    png_path = os.path.join(config['headimagefolder'], f"{selected_activity}.png")

    if os.path.exists(jpg_path):
        return FileResponse(jpg_path)
    elif os.path.exists(png_path):
        return FileResponse(png_path)
    raise HTTPException(status_code=404, detail="图片不存在")

@router.get("/getImagesize")
async def get_imagesize(request: Request):
    # 提取请求体当中的imageId
    image_id = request.query_params.get("imageId")
    # 直接去'imagefolder'文件夹下找imageId.png或者imageId.jpg
    # 如果找到就返回以kb为单位的大小，找不到就返回404
    jpg_path = os.path.join(config['imagefolder'], f"{image_id}.jpg")
    png_path = os.path.join(config['imagefolder'], f"{image_id}.png")
    if os.path.exists(jpg_path):
        size = os.path.getsize(jpg_path) / 1024
        return {"size": size}
    elif os.path.exists(png_path):
        size = os.path.getsize(png_path) / 1024
        return {"size": size}
    raise HTTPException(status_code=404, detail="图片不存在")

