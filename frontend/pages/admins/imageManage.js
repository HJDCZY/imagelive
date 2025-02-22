import { use, useEffect, useState ,useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

export default function imageManage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [pageReady, setPageReady] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState('');
    const [activities, setActivities] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [images, setImages] = useState([]);
    const [showDetails, setShowDetails] = useState(null);  // 用于跟踪当前显示详情的图片ID
    const [filterState, setFilterState] = useState('all'); 
    const [allImages, setAllImages] = useState([]);
    const [imageUrls, setImageUrls] = useState({});
    const [imageCache, setImageCache] = useState(new Map());

    // 检查登录状态，如果未登录，跳转到登录页面
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else {
                setPageReady(true);
                // 只在登录验证成功后加载内容
                fetchActivities().then(data => setActivities(data));
            }
        }
    }, [user, loading, router]);

    // 清理预览URL
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    // 修改清理函数
    useEffect(() => {
        return () => {
            setImageCache(new Map());
        };
    }, []);

    const getImageUrl = useCallback((imageId) => {
        if (!imageCache.has(imageId)) {
            const url = `${config.backendUrl}/image/${imageId}`;
            setImageCache(prev => {
                const newCache = new Map(prev);
                newCache.set(imageId, url);
                return newCache;
            });
            return url;
        }
        return imageCache.get(imageId);
    }, [imageCache]);

    const filterImagesByState = useCallback((images, state) => {
        if (state === 'all') return images;
        return images.filter(img => img.state === state);
    }, []);

    // 修改过滤器处理函数
    const handleFilterChange = useCallback((e) => {
        const newFilterState = e.target.value;
        setFilterState(newFilterState);
        
        if (!allImages?.length) return;
        
        // 预加载过滤后的图片
        const filteredImages = allImages.filter(img => {
            if (newFilterState === 'all') return true;
            return img.state === newFilterState;
        });
    
        // 对新的过滤图片进行预缓存
        filteredImages.forEach(img => {
            if (!imageCache.has(img.id)) {
                const url = `${config.backendUrl}/image/${img.id}`;
                setImageCache(prev => {
                    const newCache = new Map(prev);
                    newCache.set(img.id, url);
                    return newCache;
                });
            }
        });
    
        setImages(filteredImages);
    }, [allImages, imageCache]);

    // 如果页面未准备好，显示加载状态
    if (!pageReady) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#666'
            }}>
                正在加载...
            </div>
        );
    }

    function handleSelect() {
        if (!selectedActivity) {
            alert('请选择活动');
            return;
        }
        fetchImages(selectedActivity);  
    }





    
    const fetchImages = async (activityName) => {
        try {
            const response = await fetch(`${config.backendUrl}/getImagesBackend?selectedActivity=${activityName}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
    
            const data = await response.json();
            if (data && data.success) {
                const fetchedImages = data.images || [];
                setAllImages(fetchedImages);
                setImages(filterImagesByState(fetchedImages, filterState));
            }else {
                setAllImages([]);
                setImages([]);
                alert(data?.detail || '该活动暂无图片');
            }
        } catch (error) {
            console.error('获取图片失败:', error);
            setAllImages([]);
            setImages([]);
            alert('获取图片失败：' + (error.message || '未知错误'));
        }
    };
        // 修改 handleApprove 函数
    const handleApprove = async (id) => {
        try {
            const response = await fetch(`${config.backendUrl}/approveImage`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    approved: true,
                    reviewer: user  // 添加审核者信息
                })
            });
    
            const data = await response.json();
            if (data.success) {
                const updatedImages = allImages.map(img => 
                    img.id === id 
                        ? {...img, state: 'approved', reviewer: user} 
                        : img
                );
                setAllImages(updatedImages);
                setImages(filterImagesByState(updatedImages, filterState));
            } else {
                alert(data.detail || '操作失败');
            }
        } catch (error) {
            console.error('审核失败:', error);
            alert('审核失败：' + (error.message || '未知错误'));
        }
    };
    
    // 修改 handleReject 函数
    const handleReject = async (id) => {
        try {
            const response = await fetch(`${config.backendUrl}/approveImage`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    approved: false,
                    reviewer: user // 添加审核者信息
                })
            });
    
            const data = await response.json();
            if (data.success) {
                const updatedImages = allImages.map(img => 
                    img.id === id 
                        ? {...img, state: 'rejected', reviewer: user} 
                        : img
                );
                setAllImages(updatedImages);
                setImages(filterImagesByState(updatedImages, filterState));
            } else {
                alert(data.detail || '操作失败');
            }
        } catch (error) {
            console.error('拒绝失败:', error);
            alert('拒绝失败：' + (error.message || '未知错误'));
        }
    };
    
    const handleDelete = async (id) => {
        if (!confirm('确定要删除这张图片吗？')) {
            return;
        }
    
        try {
            const response = await fetch(`${config.backendUrl}/deleteImage`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id
                })
            });
    
            const data = await response.json();
            if (data.success) {
                const newAllImages = allImages.filter(img => img.id !== id);
                setAllImages(newAllImages);
                setImages(filterImagesByState(newAllImages, filterState));
            } else {
                alert(data.detail || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败：' + (error.message || '未知错误'));
        }
    };

    // “选择活动” 复选框 按钮：确认选择
    return (
        <div style={{ padding: '20px' }}>
        <h1 style={{ marginBottom: '20px' }}>图片管理</h1>
        
        {/* 活动选择部分 */}
        <div style={{ marginBottom: '20px' }}>
    <select
        value={selectedActivity}
        onChange={(e) => setSelectedActivity(e.target.value)}
        style={{
            padding: '8px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd'
        }}
    >
        <option value="">请选择活动</option>
        {activities.map(activity => (
            <option 
                key={activity.activityName} 
                value={activity.activityName}
            >
                {activity.activityLabel}
            </option>
        ))}
    </select>
    <button
        onClick={handleSelect}
        style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'  // 添加右边距
        }}
    >
        确认选择
    </button>
    <button
    onClick={() => selectedActivity ? fetchImages(selectedActivity) : alert('请先选择活动')}
    style={{
        padding: '8px 16px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '10px'  // 添加右边距
    }}
>
    刷新图片
</button>
<select
    value={filterState}
    onChange={handleFilterChange}
    style={{
        padding: '8px',
        marginLeft: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd'
    }}
>
    <option value="all">显示全部图片</option>
    <option value="justupload">仅显示未审核</option>
    <option value="approved">仅显示已通过</option>
    <option value="rejected">仅显示已拒绝</option>
</select>
</div>

         {/* 图片网格 */}
         <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    padding: '20px 0'
}}>
{images.map(image => (
    <div 
        key={image.id}
        style={{
            position: 'relative',
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            height: '200px' // 固定高度
        }}
        onMouseLeave={() => setShowDetails(null)} // 鼠标离开时隐藏详情
        >
            <div style={{
                width: '100%',
                height: '200px',
                position: 'relative',
                flexShrink: 0 // 防止图片被压缩
            }}>
                        <img
                            src={getImageUrl(image.id)}
                            alt={`图片 ${image.id}`}
                            loading="lazy"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                backgroundColor: '#f5f5f5',
                                transition: 'opacity 0.3s',
                                opacity: imageCache.has(image.id) ? 1 : 0  // 合并透明度设置
                            }}
                            onLoad={(e) => {
                                e.target.style.opacity = 1;
                            }}
                        />
                        {/* 悬浮按钮层 */}
                        <div
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '10px',
            padding: '20px',
            opacity: 0,
            transition: 'opacity 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
    >
    <button 
        onClick={() => handleApprove(image.id)}
        style={{
            ...buttonStyle,
            margin: 0,  // 移除margin
            width: '100%',    // 使按钮填满格子
            height: '100%'
        }}
    >
        通过
    </button>
    <button 
        onClick={() => handleReject(image.id)}
        style={{
            ...buttonStyle,
            margin: 0,
            width: '100%',
            height: '100%'
        }}
    >
        不通过
    </button>
    <button 
        onClick={() => handleDelete(image.id)}
        style={{
            ...buttonStyle,
            margin: 0,
            width: '100%',
            height: '100%'
        }}
    >
        删除
    </button>
    <button 
        onClick={() => setShowDetails(showDetails === image.id ? null : image.id)}
        style={{
            ...buttonStyle,
            margin: 0,
            width: '100%',
            height: '100%'
        }}
    >
        查看详情
    </button>

                    </div>
                    </div>
                    {/* 详情信息层 */}
                    {showDetails === image.id && (
    <div style={{
        padding: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        fontSize: '0.9rem',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2
    }}>
        <div>图片ID: {image.id}</div>
        <div>上传者: {image.uploader}</div>
        <div>审核状态: {getStateText(image.state)}</div>
        <div>审核人: {image.reviewer || '未审核'}</div>
        <div>点赞数: {image.likes}</div>
        <div>上传时间: {image.upload_time}</div>
    </div>
)}
                </div>
            
        ))}

        
        </div>
    </div>
    );

}



function fetchActivities() {
    return fetch(`${config.backendUrl}/getActivities`, {
        method: 'GET',
        credentials: 'include',  // 添加这行以发送cookie
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => data.activities.map(([name, label]) => ({ 
        activityName: name, 
        activityLabel: label || name 
    })));
}

const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',  // 略微透明
    color: 'black',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        transform: 'scale(0.98)'  // 点击效果
    }
};

const getStateText = (state) => {
    switch (state) {
        case 'approved':
            return '已通过';
        case 'rejected':
            return '不予通过';
        case 'justupload':
            return '未审核';
        default:
            return state;
    }
};