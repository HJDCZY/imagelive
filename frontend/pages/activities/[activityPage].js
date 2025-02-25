import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import config from '../../config';
import LoadingScreen from '../../components/loadscreen';

const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;


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
    const [isOnline, setIsOnline] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const minLoadingTime = 2000; // 最小加载时间为2秒
    const [displayMode, setDisplayMode] = useState('grid'); // 'waterfall', 'grid', 'timeline'
    const [sortMode, setSortMode] = useState('timeDesc'); // 'timeAsc', 'timeDesc', 'likes'
    const [columnsCount, setColumnsCount] = useState(3); // 默认每行3张图片
    const [showShareToast, setShowShareToast] = useState(false);
    const [hasShared, setHasShared] = useState(false);
    
    // 添加是否显示新图片提示的状态
    const [newImagesCount, setNewImagesCount] = useState(0);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (router.query.activityPage) {
                getActivityData();
            }
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            setError('网络连接已断开，请检查网络设置');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [router.query.activityPage]);

    useEffect(() => {
        const getActivityData = async () => {
            if (!router.query.activityPage) return;

            const startTime = Date.now();
            
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
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
                
                // 使用 setTimeout 确保最小显示时间
                setTimeout(() => {
                    setLoading(false);
                    setInitialLoading(false);
                }, remainingTime);
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
    // 修改轮询逻辑，添加网络状态检查
    useEffect(() => {
        let pollInterval;

        if (polling && router.query.activityPage && isOnline) {
            pollInterval = setInterval(pollImages, 5000);
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [router.query.activityPage, polling, isOnline]);

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

    const fetchWithRetry = async (url, options, maxRetries = 3) => {
        const timeout = 10000; // 10秒超时
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
    
                const response = await fetch(url, {
                    ...options,
                    credentials: 'include',
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        ...(options.headers || {})
                    },
                    keepalive: true // 保持连接活跃
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return response;
            } catch (error) {
                const isLastAttempt = i === maxRetries - 1;
                const isTimeout = error.name === 'AbortError';
                const waitTime = Math.min(1000 * Math.pow(2, i), 8000); // 指数退避，最大等待8秒
                
                console.error(`请求失败 (${i + 1}/${maxRetries}):`, error.message);
                
                if (isLastAttempt) throw error;
                if (!isTimeout) await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    };


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

    const handleShare = async () => {
        if (hasShared) return; // 如果已经转发过，直接返回
    
        try {
            const currentUrl = window.location.href;
            await navigator.clipboard.writeText(currentUrl);
    
            const response = await fetch(
                `${config.backendUrl}/shareActivity?name=${router.query.activityPage}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            if (!response.ok) {
                throw new Error('分享失败');
            }
    
            const data = await response.json();
            if (data.success) {
                setActivity(prev => ({
                    ...prev,
                    shares: prev.shares + 1
                }));
                setHasShared(true); // 标记为已转发
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 3000);
            }
        } catch (error) {
            console.error('分享失败:', error);
        }
    };


    if (loading || initialLoading) {
        return <LoadingScreen />;
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

    // 修改点赞按钮样式
    const activityLikeButton = (
        <button 
            onClick={handleLikeActivity}
            disabled={likedActivity}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px', // 减小内边距
                backgroundColor: likedActivity ? 'rgba(108, 117, 125, 0.8)' : 'rgba(255, 255, 255, 0.3)', // 改为半透明背景
                color: 'white', // 文字始终为白色
                border: '1px solid rgba(255, 255, 255, 0.2)', // 添加微弱的边框
                borderRadius: '4px',
                cursor: likedActivity ? 'default' : 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(4px)' // 添加磨砂效果
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
                position: 'relative',
                paddingTop: '100%',
                backgroundColor: '#f8f9fa'
            }}
        >
            <img
                src={`${config.backendUrl}${image.url}`}
                alt={`活动图片 ${image.id}`}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
            />
            <button 
                onClick={() => handleLikeImage(image.id)}
                disabled={likedImages.has(image.id)}
                style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    right: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                    backgroundColor: likedImages.has(image.id) ? 'rgba(108, 117, 125, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: likedImages.has(image.id) ? 'white' : '#212529',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: likedImages.has(image.id) ? 'default' : 'pointer',
                    backdropFilter: 'blur(4px)',
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' // 响应式字体大小
                }}
            >
                <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>❤️</span>
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
                // throw new Error('点赞失败');
                console.error('点赞失败');
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

    const getDisplayStyle = (mode) => {
        switch (mode) {
            case 'grid':
                return {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columnsCount}, 1fr)`, // 使用用户选择的列数
                    gap: '0.1vw',
                    margin: '0 auto',
                    width: '100%'
                };
            case 'timeline':
                // 保持时间轴的样式不变
                return {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5cm',
                    width: '100%',
                    margin: '0 auto',
                    '@media screen and (maxWidth: 14cm)': {
                        gap: '0.3cm'
                    }
                };
            default:
                return {};
        }
    };
    
    const getSortedImages = (images, sortMode) => {
        const sortedImages = [...images];
        switch (sortMode) {
            case 'timeAsc':
                return sortedImages.sort((a, b) => new Date(a.upload_time) - new Date(b.upload_time));
            case 'timeDesc':
                return sortedImages.sort((a, b) => new Date(b.upload_time) - new Date(a.upload_time));
            case 'likes':
                return sortedImages.sort((a, b) => b.likes - a.likes);
            default:
                return sortedImages;
        }
    };

    const groupImagesByTimeSlot = (images, sortMode) => {
        const groups = {};
        
        images.forEach(image => {
            const time = new Date(image.upload_time);
            const hour = time.getHours();
            const minute = time.getMinutes();
            
            // 根据排序模式决定取整方向
            let nextHour = hour;
            let roundedMinute = '00';
            
            if (sortMode === 'timeAsc') {
                // 时间正序时向下取整
                if (minute > 30) {
                    roundedMinute = '30';
                } else {
                    roundedMinute = '00';
                }
            } else {
                // 时间倒序时向上取整
                if (minute <= 30) {
                    roundedMinute = '30';
                } else {
                    nextHour = (hour + 1) % 24;
                    roundedMinute = '00';
                }
            }
            
            const slotKey = `${nextHour}:${roundedMinute}`;
            
            if (!groups[slotKey]) {
                groups[slotKey] = [];
            }
            groups[slotKey].push(image);
        });
        
        return groups;
    };

    // 修改时间轴显示组件
    const TimelineSection = ({ timeSlot, images }) => {
        const [hour, minute] = timeSlot.split(':');  
        const displayTime = `${hour.padStart(2, '0')}:${minute}`; 
        
        return (
            <div style={{
                position: 'relative',
                marginBottom: '2rem',
                width: '100%'
            }}>
                {/* 时间分隔线 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '30px 0',
                    width: '100%'
                }}>
                    <div style={{
                        height: '1px',
                        backgroundColor: '#e9ecef',
                        flex: 1
                    }}/>
                    <span style={{
                        padding: '0 20px',
                        color: '#666',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                    }}>
                        ——— {displayTime} ———
                    </span>
                    <div style={{
                        height: '1px',
                        backgroundColor: '#e9ecef',
                        flex: 1
                    }}/>
                </div>
                
                {/* 图片网格 */}
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '@media (max-width: 1200px)': {
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    padding: '0.5rem'
                },
                '@media (max-width: 768px)': {
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.25rem',
                    padding: '0.25rem'
                },
                '@media (max-width: 480px)': {
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.125rem',
                    padding: '0.125rem'
                }
                }}>
                    {images.map(image => (
                        <div 
                            key={image.id}
                            style={{
                                position: 'relative',
                                paddingTop: '100%'
                            }}
                        >
                            <img
                                src={`${config.backendUrl}${image.url}`}
                                alt={`活动图片 ${image.id}`}
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
                            <button 
                                onClick={() => handleLikeImage(image.id)}
                                disabled={likedImages.has(image.id)}
                                style={{
                                    position: 'absolute',
                                    bottom: '0.5rem',
                                    right: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 2vw, 0.75rem)',
                                    backgroundColor: likedImages.has(image.id) ? 'rgba(108, 117, 125, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                                    color: likedImages.has(image.id) ? 'white' : '#212529',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    cursor: likedImages.has(image.id) ? 'default' : 'pointer',
                                    backdropFilter: 'blur(4px)',
                                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                                }}
                            >
                                <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>❤️</span>
                                <span>{image.likes}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
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
                        {/* 活动标题和信息容器 */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column', // 改为垂直布局
                            marginBottom: '15px',
                            maxWidth: '80%' // 控制整体容器宽度
                        }}>
                            {/* 标题 */}
                            <h1 style={{ 
                                margin: 0,
                                marginBottom: '0.5rem',
                                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal',
                                lineHeight: '1.2'
                            }}>
                                {activity.label || activity.name}
                            </h1>
                            
                            {/* 日期和地点容器 */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px',
                                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)'
                            }}>
                                <span style={{
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>📅</span>
                                    <span>{activity.date}</span>
                                </span>
                                <span style={{
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>📍</span>
                                    <span>{activity.location}</span>
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
                                <button 
                                    onClick={handleShare}
                                    disabled={hasShared}
                                    style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '6px 12px', // 减小内边距
                                        backgroundColor: hasShared ? 'rgba(108, 117, 125, 0.8)' : 'rgba(255, 255, 255, 0.3)', // 改为半透明背景
                                        color: 'white', // 文字始终为白色
                                        border: '1px solid rgba(255, 255, 255, 0.2)', // 添加微弱的边框
                                        borderRadius: '4px',
                                        cursor: hasShared ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                        backdropFilter: 'blur(4px)' // 添加磨砂效果
                                    }}
                                >
                                    <span>🔄</span>
                                    <span>{activity.shares}</span>
                                </button>

                                {/* 添加分享成功提示 */}
                                {showShareToast && (
                                    <div style={{
                                        position: 'fixed',
                                        top: '20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        padding: '10px 20px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        borderRadius: '4px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        zIndex: 1000,
                                        animation: 'fadeIn 0.3s ease-in-out'
                                    }}>
                                        当前页面链接已经复制到剪贴板
                                    </div>
                                )}


                                
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

            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
            }}>
            <div style={{ 
                display: 'flex', 
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {/* 现有的显示方式选择器 */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: 'clamp(12px, 3vw, 14px)'
                }}>
                    <label>显示方式:</label>
                    <select
                        value={displayMode}
                        onChange={(e) => setDisplayMode(e.target.value)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: 'inherit'
                        }}
                    >
                        <option value="grid">方格图</option>
                        <option value="timeline">时间轴</option>
                    </select>
                </div>

                {/* 添加列数选择器 */}
                {displayMode === 'grid' && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: 'clamp(12px, 3vw, 14px)'
                    }}>
                        <label>每行显示:</label>
                        <select
                            value={columnsCount}
                            onChange={(e) => setColumnsCount(Number(e.target.value))}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontSize: 'inherit'
                            }}
                        >
                            {[1, 2, 3, 4, 5].map(num => (
                                <option key={num} value={num}>{num}张图片</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* 现有的显示顺序选择器 */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: 'clamp(12px, 3vw, 14px)'
                }}>
                    <label>显示顺序:</label>
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: 'inherit'
                        }}
                    >
                        <option value="timeAsc">时间正序</option>
                        <option value="timeDesc">时间倒序</option>
                        <option value="likes">点赞榜</option>
                    </select>
                </div>
                <button 
                    onClick={() => router.push('/')}
                    style={{
                        padding: '0.15cm 0.3cm',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: 'clamp(12px, 3vw, 14px)',
                        whiteSpace: 'nowrap',
                        marginRight: 'auto'
                    }}
                >
                    返回首页
                </button>
            </div>

</div>
    
            {/* 图片展示区域 */}
            <div style={{
    marginTop: '30px',
    ...getDisplayStyle(displayMode)
}}>
    {displayMode === 'timeline' ? (
        Object.entries(groupImagesByTimeSlot(getSortedImages(images, sortMode), sortMode))
            .map(([timeSlot, timeImages]) => (
                <TimelineSection 
                    key={timeSlot} 
                    timeSlot={timeSlot} 
                    images={timeImages}
                />
            ))
    ) : (
        getSortedImages(images, sortMode).map(image => imageCard(image))
    )}
</div>
    

        <Footbar />
            
        </div>


        
    );
}

function Footbar() {
    return (
        <footer style={{
            marginTop: '50px',
            paddingTop: '30px',
            borderTop: '1px solid #eee',
            textAlign: 'center'
        }}>
            <img 
                src={config.logopath}
                alt="Logo"
                style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'contain',
                    marginBottom: '15px'
                }}
            />
            
            <h2 style={{
                color: '#333',
                marginBottom: '10px',
                fontWeight: 'normal',
                fontSize: '1.2rem'
            }}>
                © 天津大学学生电视台 版权所有
            </h2>
            
            <div style={{
                color: '#666',
                fontSize: '14px',
                marginTop: '5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px'
            }}>
                <span>由HJDCZY在2024-2025寒假初次开发</span>
                <span>imagelive 项目采用 GPL-3.0 开源协议</span>
                <a 
                    href="https://github.com/HJDCZY/imagelive" 
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#3498db',
                        textDecoration: 'none'
                    }}
                >
                    在 GitHub 上查看源代码
                </a>
            </div>
        </footer>
    );
}