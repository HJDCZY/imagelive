# #启动mysql数据库
# mysqld --user=root &

# #启动后端服务

# uvicorn main:app --host 0.0.0.0 --port 47840 \
#   --ssl-keyfile=/hjdczy.top/cert/Nginx/hjdczy.top.key \
#   --ssl-certfile=/hjdczy.top/cert/Nginx/hjdczy.top.crt


nohup  gunicorn main:app     --workers 5     --worker-class uvicorn.workers.UvicornWorker     --bind 0.0.0.0:47840     --keyfile=/hjdczy.top/cert/Nginx/hjdczy.top.key     --certfile=/hjdczy.top/cert/Nginx/hjdczy.top.crt &