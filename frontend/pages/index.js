import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';  // 添加路由导入
import config from '../config';
import {Icon} from '@mdi/react';
import { mdiCalendarMonth,mdiMapMarker,mdiThumbUp,mdiEye,mdiShare } from '@mdi/js';

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
            // console.log('获取活动列表成功:', formattedActivities);
        })
        .catch(error => console.error('获取活动列表失败:', error));
    }

    const handleActivityClick = (activityName) => {
        router.push(`/activities/${activityName}?loadScreen=true`);
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
                                <p style={{ 
                                    margin: '5px 0', 
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'  // 添加图标和文字之间的间距
                                }}>
                                    <Icon path={mdiCalendarMonth} size={1} /> {activity.date}
                                </p>
                                <p style={{ 
                                    margin: '5px 0', 
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'  // 添加图标和文字之间的间距
                                }}>
                                    <Icon path={mdiMapMarker} size={1} /> {activity.location}
                                </p>
                            </div>
                             <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                borderTop: '1px solid #eee',
                                paddingTop: '15px',
                                marginTop: 'auto'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Icon path={mdiEye} size={1} /> {activity.views}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Icon path={mdiThumbUp} size={1} /> {activity.likes}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Icon path={mdiShare} size={1} /> {activity.shares}
                                </span>
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

            <Footbar />

        </div>
    );
}


