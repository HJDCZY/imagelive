# 主页用到的后端接口
from fastapi import APIRouter, Request, HTTPException
from config import config
import mysql_queries

router = APIRouter()

@router.get("/frontgetactivities")
async def frontgetactivities(request: Request):
    # 获取所有活动
    query = "select name, label ,date , views , likes , shares , location from activities"
    result = mysql_queries.query(mysql_queries.connection, query)
    if result:
        return result
    elif result == []:
        return []
    else:
        raise HTTPException(status_code=500, detail="数据库错误")
    
    

@router.get("/frontgetactivity/{name}")
async def frontgetactivity(request: Request, name: str):
    # 获取指定活动
    query = f"select name, label ,date , views , likes , shares , location from activities where name = '{name}'"
    result = mysql_queries.query(mysql_queries.connection, query)
    if result:
        return result
    elif result == []:
        return []
    else:
        raise HTTPException(status_code=500, detail="数据库错误")


#做一个简单的小限制，验证请求头的自定义属性"isYouABrowser"是否为"yes"，如果不是则返回403
@router.get("/likeactivity") 
async def likeactivity(request: Request, name: str):
    # 检查请求头
    browser_check = request.headers.get("isYouABrowser")
    if not browser_check or browser_check.lower() != "yes":
        raise HTTPException(status_code=403, detail="小爬虫还想刷赞？我设的第一关都没过")

    # 点赞活动
    query = "update activities set likes = likes + 1 where name = %s"  # 使用参数化查询防止SQL注入
    result = mysql_queries.query(mysql_queries.connection, query, (name,))
    if result:
        return {"success": True}
    else:
        raise HTTPException(status_code=500, detail="数据库错误")
    
#使用一样的方法，验证请求头的自定义属性"isYouABrowser"是否为"yes"，如果不是则返回403
@router.get("/likeimage")
async def likeimage(request: Request, id: int):
    # 检查请求头
    browser_check = request.headers.get("isYouABrowser")
    if not browser_check or browser_check.lower() != "yes":
        raise HTTPException(status_code=403, detail="小爬虫还想刷赞？我设的第一关都没过")

    # 点赞图片
    query = "update photos set likes = likes + 1 where id = %s"
    result = mysql_queries.query(mysql_queries.connection, query, (id,))
    if result:
        return {"success": True}
    else:
        raise HTTPException(status_code=500, detail="数据库错误")
    
    
@router.get("/seeActivity")
async def seeActivity(request: Request, name: str):
    # 增加活动浏览量
    query = "update activities set views = views + 1 where name = %s"
    result = mysql_queries.query(mysql_queries.connection, query, (name,))
    if result:
        return {"success": True}
    else:
        raise HTTPException(status_code=500, detail="数据库错误")
    