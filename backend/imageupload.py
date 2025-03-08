import mysql_queries
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from account import get_user_auth
from jose import JWTError, jwt
import os
from config import config
from fastapi import Form, File, UploadFile
import os
import cv2
from PIL import Image
import io

router = APIRouter()

@router.post("/uploadImages")
async def upload_images(
    request: Request,
    files: list[UploadFile] = File(...),
    activity_name: str = Form(...)
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
                uploaded_files = []
                for file in files:
                    try:
                        # 1. 获取文件内容和扩展名
                        contents = await file.read()
                        ext = os.path.splitext(file.filename)[1].lower()
                        if ext not in ['.jpg', '.png']:
                            continue

                        # 2. 在数据库中创建记录
                        query = """
                            INSERT INTO photos (activity_name, uploader, state) 
                            VALUES (%s, %s, 'justupload')
                        """
                        result = mysql_queries.query(
                            mysql_queries.connection, 
                            query, 
                            (activity_name, username)
                        )
                        
                        if result:
                            # 获取插入记录的 ID
                            query = "SELECT LAST_INSERT_ID()"
                            result = mysql_queries.query(mysql_queries.connection, query)
                            photo_id = result[0][0]
                            
                            # 3. 保存原始文件
                            file_path = os.path.join(
                                config['imagefolder'], 
                                f"{photo_id}{ext}"
                            )
                            with open(file_path, "wb") as f:
                                f.write(contents)

                            # 4. 生成并保存缩略图
                            try:
                                # 从二进制数据读取图片
                                img = Image.open(io.BytesIO(contents))
                                
                                # 计算缩放比例
                                max_size = 1024
                                ratio = max_size / max(img.size)
                                if ratio < 1:  # 只有当图片大于1024时才需要缩放
                                    new_size = tuple(int(dim * ratio) for dim in img.size)
                                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                                
                                # 保存为WebP格式
                                thumb_path = os.path.join(
                                    config['thumbnailfolder'],
                                    f"{photo_id}.webp"
                                )
                                img.save(thumb_path, 'WEBP', quality=85)
                                
                            except Exception as e:
                                raise HTTPException(status_code=500, detail="无法生成缩略图，具体原因：" + str(e))
                            
                            uploaded_files.append(photo_id)

                    except Exception as e:
                        print(f"处理文件 {file.filename} 时出错: {str(e)}")
                        continue
                if uploaded_files:
                    return {"success": True, "uploaded_files": uploaded_files}
                raise HTTPException(status_code=400, detail="没有文件上传成功")

            raise HTTPException(status_code=400, detail="权限不足")
        raise HTTPException(status_code=400, detail="用户不存在")
    except JWTError:
        raise HTTPException(status_code=400, detail="未登录")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))