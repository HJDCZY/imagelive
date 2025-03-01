import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import config from '../../config';
import LoadingScreen from '../../components/loadscreen';

export default function FaceCompare() {
    const router = useRouter();
    const { activity } = router.query;
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [matchedPhotos, setMatchedPhotos] = useState([]);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('select'); // 'select', 'camera', 'upload', 'results'

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // 启动摄像头
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setStream(mediaStream);
            setMode('camera');
            
            // 等待 video 元素就绪
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('无法访问摄像头');
            console.error('摄像头错误:', err);
        }
    };

    // 拍照
    const takePhoto = () => {
        setLoading(true); // 立即设置加载状态
        setError(null);
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'photo.jpg', { 
                type: 'image/jpeg',
                lastModified: Date.now()
            });
            setPhoto(file);
            stopCamera();
            await submitPhoto(file);
        }, 'image/jpeg', 0.8);
    };

    // 停止摄像头
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // 处理文件上传
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('请上传图片文件');
                return;
            }
            setLoading(true); // 立即设置加载状态
            setError(null);
            setPhoto(file);
            await submitPhoto(file);
        }
    };

    // 提交照片到后端
    const submitPhoto = async (photoFile) => {
        try {
            const formData = new FormData();
            formData.append('file', photoFile);

            const response = await fetch(`${config.backendUrl}/compareFaces?activity_name=${activity}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || `HTTP ${response.status} - ${response.statusText}`);
            }

            setMatchedPhotos(data);
            setMode('results');
        } catch (err) {
            setError('照片比对失败：' + (err.message || '未知错误'));
        } finally {
            setLoading(false);
        }
    };

    // 清理效果
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    if (loading) {
        return (

            <LoadingScreen message="正在比对照片...  请稍等" />

        );
    }

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px'
        }}>
            <h1 style={{
                textAlign: 'center',
                marginBottom: '30px'
            }}>
                找到我的照片
            </h1>

            {error && (
                <div style={{
                    padding: '10px',
                    backgroundColor: '#ff5252',
                    color: 'white',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            {mode === 'select' && (
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={startCamera}
                        style={{
                            padding: '15px 30px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        使用摄像头
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        id="fileInput"
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor="fileInput"
                        style={{
                            padding: '15px 30px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        上传照片
                    </label>
                </div>
            )}

            {mode === 'camera' && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            borderRadius: '8px'
                        }}
                    />
                    <button
                        onClick={takePhoto}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        拍照
                    </button>
                </div>
            )}

            {mode === 'results' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                    {matchedPhotos.length > 0 ? (
                        matchedPhotos.map(photoId => (
                            <div
                                key={photoId}
                                style={{
                                    position: 'relative',
                                    paddingTop: '100%'
                                }}
                            >
                                <img
                                    src={`${config.backendUrl}/image/${photoId}`}
                                    alt={`匹配照片 ${photoId}`}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        ))
                    ) : (
                        <p>没有找到匹配的照片</p>
                    )}
                </div>
            )}

            <div style={{
                marginTop: '20px',
                textAlign: 'center'
            }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    返回
                </button>
            </div>
        </div>
    );
}