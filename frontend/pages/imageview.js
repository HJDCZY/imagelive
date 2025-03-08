import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import config from '../config';

export default function Imageview() {
    const router = useRouter();
    const [image, setImage] = useState(null);
    const [imageSize, setImageSize] = useState(null);
    const { activity, imageId } = router.query;

    useEffect(() => {
        if (!imageId) return;
        // 获取图片大小
        fetch(`${config.backendUrl}/getImagesize?imageId=${imageId}`, {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => response.json())
        .then(data => {
            setImageSize(data.size / 1024); // 转换为 MB
        })
        .catch(error => console.error('获取图片大小失败:', error));
    }, [imageId]);

    if (!activity || !imageId) {
        return <div>加载中...</div>;
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#000'
        }}>
            {/* 图片显示区域 */}
            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}>
                <img
                    src={`${config.backendUrl}/thumbnail/${imageId}`}
                    alt="图片"
                    style={{
                        maxWidth: '100%',
                        maxHeight: 'calc(100vh - 100px)',
                        objectFit: 'contain'
                    }}
                />
            </div>

            {/* 底部按钮区域 */}
            <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px'
            }}>
                <button
                    onClick={() => router.push(`/activities/${activity}?loadScreen=false`)}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    返回活动页
                </button>
                <a
                    href={`${config.backendUrl}/imagedownload/${imageId}`}
                    download
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center'
                    }}
                >
                    保存原图 {imageSize ? `(${imageSize.toFixed(2)}MB)` : ''}
                </a>
            </div>
        </div>
    );
}