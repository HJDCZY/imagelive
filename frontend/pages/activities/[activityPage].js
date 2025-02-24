import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import config from '../../config';


const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            console.error(`尝试 ${i + 1}/${maxRetries} 失败:`, error);
            if (i === maxRetries - 1) throw error;
            // 等待递增的时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};

export default function ActivityPage() {
    const router = useRouter();
    const [activity, setActivity] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likedImages, setLikedImages] = useState(new Set()); // 添加已点赞图片的状态
    const [likedActivity, setLikedActivity] = useState(false); // 添加活动点赞状态
    const [viewUpdated, setViewUpdated] = useState(false); // 添加状态跟踪是否已更新浏览量
    const [coverImage, setCoverImage] = useState(null);
    const [polling, setPolling] = useState(true); // 添加轮询控制状态
    const [imageLoading, setImageLoading] = useState(true);
    
    // 添加是否显示新图片提示的状态
    const [newImagesCount, setNewImagesCount] = useState(0);

    useEffect(() => {
        const getActivityData = async () => {
            if (!router.query.activityPage) return;
            
            try {
                // 获取封面图片
                const coverResponse = await fetchWithRetry(
                    `${config.backendUrl}/getCoverImage?selectedActivity=${router.query.activityPage}`,
                    { method: 'GET' }
                ).catch(() => null); // 如果获取封面失败，不影响其他功能

                if (coverResponse?.ok) {
                    setCoverImage(`${config.backendUrl}/getCoverImage?selectedActivity=${router.query.activityPage}`);
                }

                // 获取活动信息
                const [activityResponse, imagesResponse] = await Promise.all([
                    fetchWithRetry(
                        `${config.backendUrl}/frontgetactivity/${router.query.activityPage}`,
                        { method: 'GET' }
                    ),
                    fetchWithRetry(
                        `${config.backendUrl}/getImagesFrontend/${router.query.activityPage}`,
                        { method: 'GET' }
                    )
                ]);

                // 处理活动数据
                const activityData = await activityResponse.json();
                const formattedActivity = {
                    name: activityData[0][0],
                    label: activityData[0][1],
                    date: activityData[0][2],
                    views: activityData[0][3],
                    likes: activityData[0][4],
                    shares: activityData[0][5],
                    location: activityData[0][6]
                };
                setActivity(formattedActivity);

                // 处理图片数据
                const imagesData = await imagesResponse.json();
                if (imagesData.success) {
                    setImages(imagesData.images);
                }

            } catch (err) {
                setError(err.message);
                console.error('获取数据失败:', err);
            } finally {
                setLoading(false);
            }
        };

        if (router.query.activityPage) {
            getActivityData();
        }
    }, [router.query.activityPage]);

    useEffect(() => {
        const updateViewCount = async () => {
            if (!router.query.activityPage || viewUpdated) return; // 如果已更新过浏览量则返回
            try {
                const response = await fetch(
                    `${config.backendUrl}/seeActivity?name=${router.query.activityPage}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setActivity(prev => prev ? {
                            ...prev,
                            views: prev.views + 1
                        } : null);
                        setViewUpdated(true); // 标记为已更新
                    }
                }
            } catch (error) {
                console.error('更新浏览量失败:', error);
            }
        };

        if (activity && !viewUpdated) { // 只在未更新过且有活动数据时更新
            updateViewCount();
        }
    }, [router.query.activityPage, activity, viewUpdated]); // 添加 viewUpdated 到依赖数组

    useEffect(() => {
        const getActivityData = async () => {
            if (!router.query.activityPage) return;
            try {
                // 获取活动基本信息
                const activityResponse = await fetch(
                    `${config.backendUrl}/frontgetactivity/${router.query.activityPage}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        }
                    }
                );

                if (!activityResponse.ok) {
                    throw new Error('获取活动信息失败');
                }

                const activityData = await activityResponse.json();
                const formattedActivity = {
                    name: activityData[0][0],
                    label: activityData[0][1],
                    date: activityData[0][2],
                    views: activityData[0][3],
                    likes: activityData[0][4],
                    shares: activityData[0][5],
                    location: activityData[0][6] 
                };
                setActivity(formattedActivity);

                // 获取活动图片
                const imagesResponse = await fetch(
                    `${config.backendUrl}/getImagesFrontend/${router.query.activityPage}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        }
                    }
                );

                if (!imagesResponse.ok) {
                    throw new Error('获取图片失败');
                }

                const imagesData = await imagesResponse.json();
                if (imagesData.success) {
                    setImages(imagesData.images);
                }
            } catch (err) {
                setError(err.message);
                console.error('获取数据失败:', err);
            } finally {
                setLoading(false);
            }
        };

        getActivityData();
    }, [router.query.activityPage]);


    // 添加轮询效果
    useEffect(() => {
        let pollInterval;

        if (polling && router.query.activityPage) {
            pollInterval = setInterval(pollImages, 5000); // 每5秒轮询一次
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [router.query.activityPage, polling]);

    // 在组件卸载时停止轮询
    useEffect(() => {
        return () => setPolling(false);
    }, []);

    // 在组件挂载时添加动画样式
    useEffect(() => {
        // 添加样式到 head
        const styleElement = document.createElement('style');
        styleElement.innerHTML = fadeInKeyframes;
        document.head.appendChild(styleElement);

        // 清理函数
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);


    // 修改轮询函数以支持新图片提示
    const pollImages = async () => {
        if (!router.query.activityPage) return;

        try {
            const imagesResponse = await fetchWithRetry(
                `${config.backendUrl}/getImagesFrontend/${router.query.activityPage}`,
                { method: 'GET' }
            );

            const imagesData = await imagesResponse.json();
            if (imagesData.success) {
                setImages(prevImages => {
                    if (imagesData.images.length > prevImages.length) {
                        const newCount = imagesData.images.length - prevImages.length;
                        setNewImagesCount(newCount);
                        setTimeout(() => setNewImagesCount(0), 5000);
                    }
                    return imagesData.images;
                });
            }
        } catch (error) {
            console.error('轮询图片失败:', error);
            // 轮询失败时不设置错误状态，避免影响用户体验
        }
    };



    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                加载中...
            </div>
        );
    }

    if (error || !activity) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <h1>{error || '活动不存在'}</h1>
                <button 
                    onClick={() => router.push('/')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '20px'
                    }}
                >
                    返回首页
                </button>
            </div>
        );
    }

     // 添加点赞活动的函数
     const handleLikeActivity = async () => {
        if (likedActivity) return; // 如果已经点赞过，直接返回

        try {
            const response = await fetch(
                `${config.backendUrl}/likeactivity?name=${router.query.activityPage}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'isYouABrowser': 'yes'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('点赞失败');
            }

            const data = await response.json();
            if (data.success) {
                setActivity(prev => ({
                    ...prev,
                    likes: prev.likes + 1
                }));
                setLikedActivity(true); // 设置为已点赞
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    };

    const activityLikeButton = (
        <button 
            onClick={handleLikeActivity}
            disabled={likedActivity}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 16px',
                backgroundColor: likedActivity ? '#6c757d' : '#f8f9fa',
                color: likedActivity ? 'white' : '#212529',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: likedActivity ? 'default' : 'pointer',
                transition: 'all 0.2s'
            }}
        >
            <span>❤️</span>
            <span>{activity.likes}</span>
        </button>
    );

    const imageCard = (image) => (
        <div 
            key={image.id}
            style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <img
                src={`${config.backendUrl}${image.url}`}
                alt={`活动图片 ${image.id}`}
                style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                }}
            />
            <button 
                onClick={() => handleLikeImage(image.id)}
                disabled={likedImages.has(image.id)}
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    backgroundColor: likedImages.has(image.id) ? 'rgba(108, 117, 125, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: likedImages.has(image.id) ? 'white' : '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: likedImages.has(image.id) ? 'default' : 'pointer',
                    backdropFilter: 'blur(4px)'
                }}
            >
                <span>❤️</span>
                <span>{image.likes}</span>
            </button>
        </div>
    );

    // 添加点赞图片的函数
        const handleLikeImage = async (imageId) => {
        if (likedImages.has(imageId)) return; // 如果已经点赞过，直接返回

        try {
            const response = await fetch(
                `${config.backendUrl}/likeimage?id=${imageId}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'isYouABrowser': 'yes'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('点赞失败');
            }

            const data = await response.json();
            if (data.success) {
                setImages(prevImages => 
                    prevImages.map(img => 
                        img.id === imageId 
                            ? {...img, likes: img.likes + 1}
                            : img
                    )
                );
                setLikedImages(prev => new Set([...prev, imageId])); // 添加到已点赞集合
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    };




        return (
        <div style={{ 
            padding: '0',
            maxWidth: '1200px', 
            margin: '0 auto' 
        }}>
            {/* 封面图片区域 */}
            <div style={{
                width: '100%',
                height: '400px',
                position: 'relative',
                marginBottom: '30px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f8f9fa'
            }}>
                {coverImage ? (
    <>
        <img
            src={coverImage}
            alt={activity.label || activity.name}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out'
            }}
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
                console.error('封面图片加载失败');
                setImageLoading(false);
                e.target.style.display = 'none';
            }}
        />
        {imageLoading && (
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
            }}>
                加载中...
            </div>
        )}
                        {/* 渐变遮罩层 */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '20px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            color: 'white'
                        }}>
                            {/* 活动标题和信息 */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                                marginBottom: '15px'
                            }}>
                                <h1 style={{ 
                                    margin: 0,
                                    fontSize: '2.5rem',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                                }}>
                                    {activity.label || activity.name}
                                </h1>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: '5px'
                                }}>
                                    <span style={{
                                        fontSize: '1.1rem',
                                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                        📅 {activity.date}
                                    </span>
                                    <span style={{
                                        fontSize: '1.1rem',
                                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                        📍 {activity.location}
                                    </span>
                                </div>
                            </div>
                            {/* 互动按钮区域 */}
                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'center'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    👁️ {activity.views}
                                </span>
                                {activityLikeButton}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    🔄 {activity.shares}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d'
                    }}>
                        暂无封面图片
                    </div>
                )}
            </div>

            {newImagesCount > 0 && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    新增 {newImagesCount} 张图片
                </div>
            )}
    
            {/* 图片展示区域 */}
            <div style={{
                marginTop: '30px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {images.map(imageCard)}
            </div>
    
            <button 
                onClick={() => router.push('/')}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                返回首页
            </button>
        </div>
    );
}


// // 添加淡入动画样式
// const style = document.createElement('style');
// style.textContent = `
//     @keyframes fadeIn {
//         from { opacity: 0; transform: translateY(-10px); }
//         to { opacity: 1; transform: translateY(0); }
//     }
// `;
// document.head.appendChild(style);