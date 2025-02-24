import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import config from '../../config';

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

    useEffect(() => {
        const getActivityData = async () => {
            if (!router.query.activityPage) return;
            try {
                // 获取封面图片
                const coverResponse = await fetch(
                    `${config.backendUrl}/getCoverImage?selectedActivity=${router.query.activityPage}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                    }
                );

                if (coverResponse.ok) {
                    setCoverImage(`${config.backendUrl}/getCoverImage?selectedActivity=${router.query.activityPage}`);
                }

                // ...existing activity and images fetching code...
            } catch (err) {
                setError(err.message);
                console.error('获取数据失败:', err);
            } finally {
                setLoading(false);
            }
        };

        getActivityData();
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
                            }}
                        />
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