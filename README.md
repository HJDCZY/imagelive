# 图片直播平台-imagelive

for English version, please click [here](README_en.md)

这是一个图片直播平台，最初为天津大学学生电视台搭建。采用前端 React + Next.js 加后端 Python + FastAPI 的架构，数据库使用 MySQL。

由速末1311和滑稽盾采紫由在2024-2025年的寒假提出并由滑稽盾采紫由初次开发，我们发现大型活动对图片直播的需求很大，但是市面上没有一个开源的图片直播平台，几乎所有的图片直播平台都是商用的且收费，所以我们决定开发一个开源的图片直播平台。

[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)


## 特性
- 实时图片直播：支持实时上传和展示活动照片
- 多活动管理：可同时管理多个直播活动
- 后台管理系统：便捷的活动和图片管理界面
- 响应式设计：前台支持PC和移动端访问
- Docker部署：提供完整的容器化部署方案

## 安装到您的服务器
首先，因为浏览器的CORS策略，此服务的开发和部署需要使用HTTPS，所以请确保您的服务器支持HTTPS并且在合适位置配置了SSL证书，后文还会提到。

### 使用docker部署
imagelive在开发中就使用了docker，我们建议您使用docker部署imagelive。
我们在每一个release中都会提供一个docker的.tar格式文件，您可以直接下载并使用docker加载这个.tar文件。

我们在docker中使用了两个端口，分别是47839和47840，其中47839是前端的端口，47840是后端的端口。您可以根据自己的需要修改这两个端口。

```bash
#部署docker
docker load -i imagelive.tar
docker run -dit -p 47839:47839 -p 47840:47840 -v /“您在主机的SSL证书和密钥路径”:/certs -v imagelive:lastest
#进入容器并启动服务
docker exec -it 容器ID /bin/bash

```
因为浏览器的CORS策略，您需要到`/home/hjdczy/imagelive/backend/main.py`中修改`allow_origins`参数，将您的域名添加到其中。

另外，您需要更改`/home/hjdczy/imagelive/frontend/config.js`文件，将封面，logo等图片的路径更改为您需要的路径。

您还需要将您需要的favicon图标复制到容器内的适当位置，并在`/home/hjdczy/imagelive/frontend/config.js`中更改favicon的路径。

我们相信您可以根据上面的提示自行完成配置。

配置完成后，您就可以启动各项服务了。

```bash
#下面的bash脚本在容器中执行
#启动mysql数据库
mysqld --user=root &

#启动前端
cd /home/hjdczy/imagelive/frontend
    #如果是开发环境
    npm run dev

    #如果是生产环境
    npm run build
    NODE_ENV=production npm run start -- --port 47839

#启动后端
cd /home/hjdczy/imagelive/backend

uvicorn main:app --host 0.0.0.0 --port 47840\
--ssl-keyfile=您的SSL证书挂载路径.key\
--ssl-certfile=您的SSL证书挂载路径.crt

```

访问您服务器的47839端口，您应该可以看到imagelive的前端页面。
如果要访问后台，您可以访问/admin，您应该可以看到后台的登录页面。

我们推荐您使用nginx反向代理来部署imagelive，这样可以更好的保护您的服务器，反向代理的部署方法在此不再赘述。

### 手动部署
如果您不想使用docker，您也可以手动部署imagelive。
首先，下载imagelive的源码，您可以使用git clone或者直接下载zip文件。

安装所需的依赖
首先，您需要安装node，npm，python3，pip3，mysql。

```bash
#安装前端所需的依赖
cd frontend
npm install

#安装后端所需的依赖
cd ../backend
pip3 install -r requirements.txt
```
之后，您需要配置数据库，我们在`backend/mysql.sql`中提供了数据库的配置文件，您可以使用这个文件来配置数据库。

数据库配置完成后，您需要修改`backend/config.py`中的数据库配置。
`backend/config.py`中还有其他的配置，您需要根据自己的配置修改。

之后，您需要修改`frontend/config.js`文件，将封面，logo等图片的路径更改为您需要的路径。

因为浏览器的CORS策略，您需要到`backend/main.py`中修改`allow_origins`参数，将您的域名添加到其中。

您还需要将您需要的favicon图标复制到frontend的适当位置，并在`frontend/config.js`中更改favicon的路径。

配置完成后，您就可以启动各项服务了。

```bash
#启动mysql数据库
#此句需要根据您的系统来修改，我们以ubuntu为例
sudo systemctl start mysql

#启动前端
cd frontend
    #如果是开发环境
    npm run dev

    #如果是生产环境
    npm run build
    NODE_ENV=production npm run start -- --port 47839

#启动后端
cd backend
uvicorn main:app --host 0.0.0.0 --port 47840\
--ssl-keyfile=您的SSL证书挂载路径.key\
--ssl-certfile=您的SSL证书挂载路径.crt

```

访问您服务器的47839端口，您应该可以看到imagelive的前端页面。
如果要访问后台，您可以访问/admin，您应该可以看到后台的登录页面。

我们推荐您使用nginx反向代理来部署imagelive，这样可以更好的保护您的服务器，反向代理的部署方法在此不再赘述。

## 未完成的功能
- 目前后端数据库中使用明文存储密码，这是不安全的，我们计划在未来的版本中使用某种方式加密密码。
- 目前前端（特别是后台）对于移动设备的适配不够好，我们计划在未来的版本中对移动设备进行更好的适配。
- 前端`frontend/pages/activities/[activityPage].js`的代码过于冗长，我们计划在未来的版本中对其进行重构。
- 整理缩进。
- 优化后台的图片上传逻辑，一张一张传
- 给后台上传图片加进度条
- 给前台人脸比对加进度条，现在人脸比对用的CPU，速度较慢，用户可能会感到不耐烦

我们欢迎您对imagelive提出建议和意见，更欢迎您参与到imagelive的开发中来，imagelive使用GPL-3.0协议，您可以自由的使用、修改、分发imagelive的源码。