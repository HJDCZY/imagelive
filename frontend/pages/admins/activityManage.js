import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';


export default function ActivityManage() {
    const [activities, setActivities] = useState([]);
    const { user, loading } = useAuth();
    const router = useRouter();
    
    // 检查登录状态，未登录则跳转到登录页面
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else {
            getActivities();
        }
    }, [user, loading, router]);

    const getActivities = () => {
        fetch(`${config.backendUrl}/getActivities`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.ok ? response.json() : Promise.reject('获取活动列表失败'))
        .then(data => setActivities(data.activities))
        .catch(error => console.error('获取活动列表失败:', error));
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>活动管理</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>活动名称（仅接受ASCII字符）</th>
                        <th>活动标签</th>
                        <th>日期</th>
                        <th>地点</th>
                        <th>点赞数</th>
                        <th>分享数</th>
                    </tr>
                </thead>
                <tbody>
                    {activities.map((activity, index) => (
                        <ActivityItem 
                            key={index}
                            activity={activity}
                            onUpdate={(updatedActivity) => {
                                const newActivities = [...activities];
                                newActivities[index] = updatedActivity;
                                setActivities(newActivities);
                            }}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ActivityItem({ activity, onUpdate }) {
    const [editing, setEditing] = useState(null);
    const [currentActivity, setCurrentActivity] = useState(activity);

    const handleEdit = (field, value) => {
        setEditing(null);
        const updatedActivity = [...currentActivity];
        const fieldIndex = {
            name: 0,
            label: 1,
            date: 2,
            location: 3,
            likes: 4,
            shares: 5
        }[field];
        
        if (updatedActivity[fieldIndex] !== value) {
            updatedActivity[fieldIndex] = value;
            setCurrentActivity(updatedActivity);
            // 这里添加更新到后端的逻辑
            fetch(`${config.backendUrl}/updateActivity`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    field,
                    value,
                    id: activity[0] // 假设第一个元素是标识符
                })
            })
            .then(response => 
                response.json().then(data => {
                    if (!response.ok) {
                        alert(data.detail || '更新失败');
                    }
                    onUpdate(updatedActivity);
                    window.location.reload();
                })
            )
            .catch(error => {
                console.error('更新失败:', error);
                setCurrentActivity(activity); // 恢复原值
            });
        }
    };

    return (
        <tr style={{ borderBottom: '1px solid #ddd' }}>
            {currentActivity.map((value, index) => (
                <td
                    key={index}
                    onClick={() => setEditing(index)}
                    style={{ 
                        padding: '8px',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    {editing === index ? (
                        <input
                            autoFocus
                            defaultValue={value}
                            onBlur={e => handleEdit(
                                ['name', 'label', 'date', 'location', 'likes', 'shares'][index],
                                e.target.value
                            )}
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    handleEdit(
                                        ['name', 'label', 'date', 'location', 'likes', 'shares'][index],
                                        e.target.value
                                    );
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '4px',
                                border: '1px solid #007bff',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <span>{value === '' || value === null || value === undefined ? '-' : value}</span>
                    )}
                </td>
            ))}
        </tr>
    );
}