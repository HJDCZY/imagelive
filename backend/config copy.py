config = {
    'database': {
        'host': 'localhost',
        'port': 3306,
        'user':'imagelive',
        'password':'CR400bf5033',
        'database':'imagelive'
    },
    'face_detector': {
        'device': 'cpu',  # 可选值: 'cpu'、'nvidia' 或 'amd'
        # GPU要求软件支持：
        # 如果使用 NVIDIA GPU，请确保：
        # 1. 已安装 CUDA Toolkit 11.x 或更高版本
        # 2. 已安装对应版本的 NVIDIA 显卡驱动
        # 3. 已安装 cuDNN
        # 4. 使用 pip install onnxruntime-gpu 安装支持 CUDA 的 ONNX Runtime
        #
        # 如果使用 AMD GPU，请确保：
        # 1. 已安装 ROCm 5.x 或更高版本
        # 2. 已安装 AMD GPU 驱动
        # 3. 使用 pip install onnxruntime-rocm 安装支持 ROCm 的 ONNX Runtime
        'providers': {
            'cpu': ['CPUExecutionProvider'],
            'nvidia': ['CUDAExecutionProvider', 'CPUExecutionProvider'],
            'amd': ['ROCMExecutionProvider', 'CPUExecutionProvider']  # AMD GPU 使用 ROCMExecutionProvider
        }
    },
    'imagefolder': '/home/hjdczy/imagelive/data/images', #存放图片的文件夹，需要手动创建
    'headimagefolder': '/home/hjdczy/imagelive/data/headimages', #存放活动头图的文件夹，需要手动创建
    'thumbnailfolder': '/home/hjdczy/imagelive/data/thumbnails', #存放缩略图的文件夹，需要手动创建
    "domain" : "tjustv.cn", # 您的根域名，用于设置cookie
    "location" : "https://backend_imagelive.tjustv.cn", # 您的后端地址，用于设置CORSMiddleware, 请注意端口号
    "frontlocation" : "https://imagelive.tjustv.cn", # 您的前端地址，用于设置CORSMiddleware , 请注意端口号
    "frontlocation2" :"https://server.tjustv.cn" , #如果您有第二个前端地址，请填写此条，否则请留空
}