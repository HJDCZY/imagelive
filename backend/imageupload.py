import mysql_queries
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from account import get_user_auth
from jose import JWTError, jwt
import os
from config import config
from fastapi import Form, File, UploadFile
import os

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
                            
                            # 3. 保存文件（使用小写扩展名）
                            file_path = os.path.join(
                                config['imagefolder'], 
                                f"{photo_id}{ext}"  # ext 已经是小写的
                            )
                            with open(file_path, "wb") as f:
                                f.write(contents)
                            
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