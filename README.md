这是一个图片直播平台，最初为天津大学学生电视台搭建


采用前端react+next.js加后端python+fastapi的架构，数据库使用mysql

由速末1311和hjdczy在2024-2025年的寒假提出并由hjdczy初次开发

docker run -dit -p 47839:47839 -p 47840:47840 -v /home/hjdczy/imagelive:/home/hjdczy/imagelive -v /hjdczy.top:/hjdczy.top ubuntu:latest

git屏蔽了node_modules，所以需要自己安装依赖

```bash
npm install
```

后端使用mysql，需要自己配置数据库，数据库配置文件我们放在了`backend/myysql.sql`中，配置完成后请修改`backend/config.py`中的数据库配置

