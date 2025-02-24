import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';  // 添加路由导入
import config from '../config';


export default function Home() {
    const router = useRouter();  // 初始化路由
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        getActivities();
    }, []);

    function getActivities() {
        fetch(`${config.backendUrl}/frontgetactivities`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.ok ? response.json() : Promise.reject('获取活动列表失败'))
        .then(data => {
            const formattedActivities = data.map(activity => ({
                name: activity[0],
                label: activity[1],
                date: activity[2],
                views: activity[3],
                likes: activity[4],
                shares: activity[5],
                location: activity[6]
            }));
            setActivities(formattedActivities);
        })
        .catch(error => console.error('获取活动列表失败:', error));
    }

    const handleActivityClick = (activityName) => {
        router.push(`/activities/${activityName}`);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>欢迎来到图片直播平台</h1>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {activities.map((activity, index) => (
                    <div 
                        key={index} 
                        onClick={() => handleActivityClick(activity.name)}
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s ease-in-out',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '400px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {/* 封面图片区域 */}
                        <div style={{
                            width: '100%',
                            height: '200px',
                            position: 'relative',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <img
                                src={`${config.backendUrl}/getCoverImage?selectedActivity=${activity.name}`}
                                alt={activity.label || activity.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #6c757d;">暂无封面</div>';
                                }}
                            />
                        </div>

                        {/* 活动信息区域 */}
                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '1.5rem' }}>{activity.label || activity.name}</h2>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '5px 0', color: '#666' }}>
                                    📅 {activity.date}
                                </p>
                                <p style={{ margin: '5px 0', color: '#666' }}>
                                    📍 {activity.location}
                                </p>
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                borderTop: '1px solid #eee',
                                paddingTop: '15px',
                                marginTop: 'auto'
                            }}>
                                <span>👁️ {activity.views}</span>
                                <span>❤️ {activity.likes}</span>
                                <span>🔄 {activity.shares}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {activities.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666' }}>
                    暂无活动
                </p>
            )}
        </div>
    );
}