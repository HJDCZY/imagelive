import cv2
import numpy as np
# import insightface
from insightface.app import FaceAnalysis
import mysql_queries
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from fastapi import Form, File, UploadFile
import os
from config import config

class FaceScanner:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FaceScanner, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not FaceScanner._initialized:
            # 初始化 InsightFace，指定使用 CPU
            self.app = FaceAnalysis(name='buffalo_sc', providers=['CPUExecutionProvider'])
            self.app.prepare(ctx_id=-1, det_size=(640, 640))
            FaceScanner._initialized = True
    
    def compare_faces(self, image1, image2):
        # 图片预处理
        img1 = cv2.imread(image1)
        img2 = cv2.imread(image2)
        
        # 调整图片大小为统一尺寸
        img1 = cv2.resize(img1, (640, 640))
        img2 = cv2.resize(img2, (640, 640))
        
        faces1 = self.app.get(img1)
        faces2 = self.app.get(img2)
        
        if len(faces1) == 0 or len(faces2) == 0:
            return False
        
        # 使用所有检测到的人脸进行比较，取最高分
        max_score = 0
        for face1 in faces1:
            for face2 in faces2:
                score = face1.normed_embedding.dot(face2.normed_embedding.T)
                max_score = max(max_score, score)
        return max_score > 0.4
    
    def compare_faces_multi_angle(self, image1, image2):
        img1 = cv2.imread(image1)
        img2 = cv2.imread(image2)
        
        angles = [-15, -10, -5, 0, 5, 10, 15]
        max_score = 0
        
        for angle in angles:
            height, width = img2.shape[:2]
            matrix = cv2.getRotationMatrix2D((width/2, height/2), angle, 1)
            rotated = cv2.warpAffine(img2, matrix, (width, height))

            faces1 = self.app.get(img1)
            faces2 = self.app.get(rotated)
            
            if len(faces1) > 0 and len(faces2) > 0:
                score = faces1[0].normed_embedding.dot(faces2[0].normed_embedding.T)
                max_score = max(max_score, score)
        return max_score > 0.4
    
    def compare_faces_multi_angle_bytes(self, image1_bytes, image2_path):
        # 从二进制数据读取第一张图片
        img1 = cv2.imdecode(np.frombuffer(image1_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img1 is None:
            print(f"无法解码上传的图片")
            return False
            
        # 读取第二张图片
        img2 = cv2.imread(image2_path)
        if img2 is None:
            print(f"无法读取图片: {image2_path}")
            return False
        
        
        angles = [-15, -10, -5, 0, 5, 10, 15]
        max_score = 0
        
        for angle in angles:
            height, width = img2.shape[:2]
            matrix = cv2.getRotationMatrix2D((width/2, height/2), angle, 1)
            rotated = cv2.warpAffine(img2, matrix, (width, height))

            faces1 = self.app.get(img1)
            faces2 = self.app.get(rotated)
            
            if len(faces1) > 0 and len(faces2) > 0:
                score = faces1[0].normed_embedding.dot(faces2[0].normed_embedding.T)
                max_score = max(max_score, score)
        print(f"比对上传的图片和数据库中的图片{image2_path},相似度: {max_score}")
        return max_score > 0.4


        

# 创建全局实例
face_scanner = FaceScanner()

if __name__ == '__main__':
    image1 = '/home/hjdczy/imagelive/data/111.jpg'
    image2 = '/home/hjdczy/imagelive/data/222.png'
    print(face_scanner.compare_faces(image1, image2))
    print(face_scanner.compare_faces_multi_angle(image1, image2))


router = APIRouter()


@router.post("/compareFaces")
async def compare_faces(request: Request, activity_name: str, file: UploadFile = File(...)):
    # 验证文件类型
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.jpg', '.png', '.jpeg']:
        raise HTTPException(status_code=400, detail="不支持的文件格式，仅支持 JPG 和 PNG")
    
    try:
        # 读取上传的文件内容
        contents = await file.read()
        
        # 查询数据库获取照片ID列表
        query = """
            SELECT id FROM photos WHERE activity_name = %s and state = 'approved'
        """
        result = mysql_queries.query(mysql_queries.connection, query, (activity_name,))
        if not result:
            raise HTTPException(status_code=404, detail="未找到该活动的照片")
            
        photo_ids = [item[0] for item in result]
        results = []
        
        # 遍历比对每张照片
        for photo_id in photo_ids:
            # 尝试不同的文件扩展名
            for try_ext in ['.jpg', '.png']:
                file_path = os.path.join(config['imagefolder'], f"{photo_id}{try_ext}")
                if os.path.exists(file_path):
                    if face_scanner.compare_faces_multi_angle_bytes(contents, file_path):
                        results.append(photo_id)
                     # 找到文件后就跳出内循环
                    
        return results
        
    except Exception as e:
        print(f"处理出错: {str(e)}")
        raise HTTPException(status_code=500, detail="处理照片时出错")