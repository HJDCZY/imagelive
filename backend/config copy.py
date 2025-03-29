config = {
    'database': {
        'host': 'localhost',
        'port': 3306,
        'user':'imagelive',
        'password':'CR400bf5033',
        'database':'imagelive'
    },
    'face_detector': {
        'device': 'gpu',
        'providers': {
            'cpu': ['CPUExecutionProvider'],
            'gpu': [{
                'device_id': 0,
                'provider': 'CUDAExecutionProvider',
            }, 'CPUExecutionProvider'],
            'amd': ['ROCMExecutionProvider', 'CPUExecutionProvider']
        }
    },
    'imagefolder': '/home/hjdczy/imagelive/data/images', #存放图片的文件夹，需要手动创建
    'headimagefolder': '/home/hjdczy/imagelive/data/headimages', #存放活动头图的文件夹，需要手动创建
    'thumbnailfolder': '/home/hjdczy/imagelive/data/thumbnails', #存放缩略图的文件夹，需要手动创建
    "domain" : "tjustv.cn", # 您的根域名，用于设置cookie
    "location" : "https://backend_imagelive.tjustv.cn:47840", # 您的后端地址，用于设置CORSMiddleware, 请注意端口号
    "frontlocation" : "https://imagelive.tjustv.cn", # 您的前端地址，用于设置CORSMiddleware , 请注意端口号
    "frontlocation2" :"https://server.tjustv.cn" , #如果您有第二个前端地址，请填写此条，否则请留空
    "frontlocation3" :"",
}