import cv2
import numpy as np
# import insightface
from insightface.app import FaceAnalysis
import mysql_queries
from fastapi import APIRouter, HTTPException, Depends, Cookie , Request
from fastapi import Form, File, UploadFile
import os
from config import config
import torch
import concurrent.futures
from typing import List
import time 
import gc

import sys
from numba import cuda

import signal
import threading


class FaceScanner:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FaceScanner, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not FaceScanner._initialized:
            try:
                import onnxruntime as ort
                print("\n=== 环境信息 ===")
                print(f"ONNX Runtime 版本: {ort.__version__}")
                print(f"可用提供程序: {ort.get_available_providers()}")
                print(f"PyTorch CUDA 可用: {torch.cuda.is_available()}")
                if torch.cuda.is_available():
                    print(f"GPU 设备: {torch.cuda.get_device_name()}")
                    print(f"当前 CUDA 设备: {torch.cuda.current_device()}")
                
                self.device = config['face_detector']['device'].lower()
                self.use_cuda = torch.cuda.is_available() and self.device == 'gpu'
                self.torch_device = torch.device('cuda' if self.use_cuda else 'cpu')
                
                # 修改提供程序配置
                providers = []
                provider_options = []
                
                if self.use_cuda:
                    providers = ['CUDAExecutionProvider']
                    provider_options = [{
                        'device_id': 0,
                        'arena_extend_strategy': 'kNextPowerOfTwo',
                        'gpu_mem_limit': 4 * 1024 * 1024 * 1024,  # 2GB
                        'cudnn_conv_algo_search': 'EXHAUSTIVE',
                    }]
                else:
                    providers = ['CPUExecutionProvider']
                    provider_options = [{}]
                
                print(f"\n=== 初始化信息 ===")
                print(f"选择设备: {self.device.upper()}")
                print(f"使用提供程序: {providers}")
                print(f"提供程序选项: {provider_options}")
                
                # 初始化 FaceAnalysis
                model_root = os.path.expanduser('~/.insightface/models')
    
                self.app = FaceAnalysis(
                    name='buffalo_sc',
                    root=model_root,
                    providers=providers,
                    provider_options=provider_options,
                    allowed_modules=['detection', 'recognition']
                )
                
                
                # 准备模型
                self.app.prepare(
                    ctx_id=0 if self.use_cuda else -1,
                    det_size=(256, 256)
                )
                
                # 初始化线程池
                self.thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
                FaceScanner._initialized = True
                print("初始化完成")
                
            except Exception as e:
                print(f"初始化失败: {str(e)}")
                if self.device == 'gpu':
                    print("尝试回退到 CPU 模式")
                    self.__init_with_cpu()
                else:
                    raise e

    @staticmethod
    def __init_with_cpu(self):
        """当 GPU 初始化失败时的回退方法"""
        try:
            self.app = FaceAnalysis(
                name='buffalo_sc',
                providers=['CPUExecutionProvider']
            )
            self.app.prepare(ctx_id=-1, det_size=(640, 640))
            print("已成功回退到 CPU 模式")
            self.thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
            FaceScanner._initialized = True
        except Exception as e:
            print(f"CPU 初始化也失败: {str(e)}")
            raise e

    def process_angle(self, img: np.ndarray, angle: float) -> List:
        """处理单个角度的图片旋转和人脸检测"""
        if angle != 0:
            height, width = img.shape[:2]
            matrix = cv2.getRotationMatrix2D((width/2, height/2), angle, 1)
            img = cv2.warpAffine(img, matrix, (width, height))
        return self.app.get(img)
    
    def preprocess_image(self, img: np.ndarray) -> np.ndarray:
        """优化的图像预处理"""
        target_size = 256  # 降低目标尺寸
        
        height, width = img.shape[:2]
        scale = min(target_size / width, target_size / height)
        
        if scale >= 1:
            return img
            
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        # 使用 INTER_LINEAR 代替 INTER_AREA，速度更快
        resized_img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
        
        return resized_img

    def batch_compare_embeddings(self, embeddings1: List[np.ndarray], embeddings2: List[np.ndarray]) -> float:
        """批量比较人脸特征向量"""
        if not embeddings1 or not embeddings2:
            return 0.0
            
        # 将numpy数组转换为PyTorch张量并移至GPU
        embeddings1_torch = torch.tensor(np.stack([e.normed_embedding for e in embeddings1]), device=self.torch_device)
        embeddings2_torch = torch.tensor(np.stack([e.normed_embedding for e in embeddings2]), device=self.torch_device)
        
        # 计算余弦相似度矩阵
        similarity_matrix = torch.mm(embeddings1_torch, embeddings2_torch.T)
        
        # 获取最大相似度
        max_score = float(similarity_matrix.max().cpu().numpy())
        return max_score
    

    def compare_faces_multi_angle_parallel(self, image1_path: str, image2_path: str) -> bool:
        """并行处理多角度人脸比对"""
        img1 = cv2.imread(image1_path)
        img2 = cv2.imread(image2_path)
        
        if img1 is None or img2 is None:
            return False
        
        # 添加预处理步骤
        img1 = self.preprocess_image(img1)
        img2 = self.preprocess_image(img2)
            
        angles = [-15, -10, -5, 0, 5, 10, 15]
        
        # 并行处理不同角度
        futures1 = [self.thread_pool.submit(self.process_angle, img1, angle) for angle in angles]
        futures2 = [self.thread_pool.submit(self.process_angle, img2, angle) for angle in angles]
        
        # 收集结果
        faces1 = []
        faces2 = []
        for future in concurrent.futures.as_completed(futures1):
            faces1.extend(future.result())
        for future in concurrent.futures.as_completed(futures2):
            faces2.extend(future.result())
            
        # 批量比较特征向量
        max_score = self.batch_compare_embeddings(faces1, faces2)
        # print (f"比对{image1_path}和{image2_path},相似度: {max_score}")
        return max_score > 0.4

    def compare_faces_multi_angle_bytes_parallel(self, image1_bytes: bytes, image2_path: str) -> bool:
        """
        并行处理字节流图片的多角度人脸比对
        
        Args:
            image1_bytes: 第一张图片的字节流数据
            image2_path: 第二张图片的文件路径
            
        Returns:
            bool: 人脸比对结果，True表示匹配，False表示不匹配
        """
        # 解码字节流图片和读取本地图片
        img1 = cv2.imdecode(np.frombuffer(image1_bytes, np.uint8), cv2.IMREAD_COLOR)
        img2 = cv2.imread(image2_path)
        
        if img1 is None or img2 is None:
            return False
        
        # 添加预处理步骤
        img1 = self.preprocess_image(img1)
        img2 = self.preprocess_image(img2)
            
        angles = [-15, -10, -5, 0, 5, 10, 15]
        
        # 并行处理不同角度
        futures1 = [self.thread_pool.submit(self.process_angle, img1, angle) for angle in angles]
        futures2 = [self.thread_pool.submit(self.process_angle, img2, angle) for angle in angles]
        
        # 收集结果
        faces1 = []
        faces2 = []
        for future in concurrent.futures.as_completed(futures1):
            faces1.extend(future.result())
        for future in concurrent.futures.as_completed(futures2):
            faces2.extend(future.result())
            
        # 批量比较特征向量
        max_score = self.batch_compare_embeddings(faces1, faces2)
        # print(f"比对上传的图片和数据库中的图片{image2_path},相似度: {max_score}")
        return max_score > 0.4


    def safe_cuda_reset(self):
        """安全地关闭和重新初始化 CUDA"""
        try:
            # 1. 首先释放所有 PyTorch CUDA 资源
            if hasattr(self, 'app'):
                del self.app
                
            if torch.cuda.is_available():
                torch.cuda.synchronize()
                torch.cuda.empty_cache()
                torch.cuda.reset_peak_memory_stats()
                
            # 2. 执行 CUDA 关闭
            if cuda.current_context():
                cuda.close()
                
            # 3. 等待资源完全释放
            time.sleep(0.5)
            gc.collect()
            
            # 4. 重新初始化 CUDA
            if self.use_cuda:
                # 重新初始化 CUDA 上下文
                cuda.current_context().reset()
                torch.cuda.init()
                
                # 重新配置提供程序
                providers = ['CUDAExecutionProvider']
                provider_options = [{
                    'device_id': 0,
                    'arena_extend_strategy': 'kNextPowerOfTwo',
                    'gpu_mem_limit': 2 * 1024 * 1024 * 1024,
                    'cudnn_conv_algo_search': 'DEFAULT',
                }]
                
                # 重新初始化 FaceAnalysis
                self.app = FaceAnalysis(
                    name='buffalo_sc',
                    root=os.path.expanduser('~/.insightface/models'),
                    providers=providers,
                    provider_options=provider_options,
                    allowed_modules=['detection', 'recognition']
                )
                
                self.app.prepare(ctx_id=0, det_size=(256, 256))
                print("CUDA 已完全重置和重新初始化")
                return True
                
        except Exception as e:
            print(f"CUDA 重置失败: {str(e)}")
            return False
        

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
        
        # 创建任务列表
        tasks = []
        for photo_id in photo_ids:
            for try_ext in ['.jpg', '.png']:
                file_path = os.path.join(config['imagefolder'], f"{photo_id}{try_ext}")
                if os.path.exists(file_path):
                    tasks.append((contents, file_path, photo_id))
                    break  # 找到文件后跳出内循环


        start = time.time()
        total_count = len(tasks)
        
        # 使用线程池并行处理比对任务
        def process_comparison(args):
            content, path, pid = args
            try:
                if face_scanner.compare_faces_multi_angle_bytes_parallel(content, path):
                    return pid
                return None
            except Exception as e:
                print(f"比对照片 {pid} 时出错: {str(e)}")
                return None
        
        # 创建线程池，设置合适的线程数
        max_workers = min(len(tasks), 10)  # 限制最大线程数为8
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(process_comparison, task) for task in tasks]
            
            # 收集结果
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result is not None:
                    results.append(result)

    
        
        end = time.time()
        print(f"比对耗时: {end - start:.2f} 秒")
        print("平均比对时间: ", (end - start)/total_count)
        
        
        #  # 清理资源并安排进程退出
        # def cleanup_and_exit():
        #     try:
        #         # 清理 GPU 资源
        #         if torch.cuda.is_available():
        #             torch.cuda.empty_cache()
        #             gc.collect()
                
        #         print("资源清理完成，准备退出进程...")
                
        #         # 获取当前进程 ID
        #         pid = os.getpid()
                
        #         # 延迟 2 秒后发送 SIGTERM 信号
        #         def delayed_exit():
        #             time.sleep(2)
        #             os.kill(pid, signal.SIGTERM)
                
        #         # 启动延迟退出线程
        #         threading.Thread(target=delayed_exit, daemon=True).start()
                
        #     except Exception as e:
        #         print(f"清理资源时出错: {str(e)}")
        
        # # 启动清理线程
        # threading.Thread(target=cleanup_and_exit, daemon=True).start()

        #
        
        
        
        return results
        
    except Exception as e:
        
        raise e
    finally:
        try:
            if hasattr(face_scanner, 'use_cuda') and face_scanner.use_cuda:
                # 尝试安全重置 CUDA
                if not face_scanner.safe_cuda_reset():
                    print("CUDA 重置失败，切换到 CPU 模式")
                    # 切换到 CPU 模式
                    face_scanner.device = 'cpu'
                    face_scanner.use_cuda = False
                    face_scanner.torch_device = torch.device('cpu')
                    face_scanner._initialized = False
                    face_scanner.__init__()
                    
        except Exception as e:
            print(f"资源清理过程中出错: {str(e)}")
            # 强制进行资源清理
            if cuda.current_context():
                try:
                    cuda.close()
                except:
                    pass
            if torch.cuda.is_available():
                try:
                    torch.cuda.empty_cache()
                    torch.cuda.reset_peak_memory_stats()
                except:
                    pass
            gc.collect()