#启动mysql数据库
mysqld --user=root &

#启动后端服务
uvicorn main:app --reload --port 39475