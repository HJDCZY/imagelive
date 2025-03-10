import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import withAuth from '../../contexts/withAuth';


function ActivityManage({ user }) {  // 从 withAuth 获取 user
    const [activities, setActivities] = useState([]);
    // const { user, loading } = useAuth();
    // const router = useRouter();
    
    // 检查登录状态，未登录则跳转到登录页面
    useEffect(() => {
        getActivities();
    }, []);

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
                        <th>活动显示名</th>
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
            <NewActivityButton />
        </div>
    );
}

function ActivityItem({ activity, onUpdate }) {
    const [editing, setEditing] = useState(null);
    const [currentActivity, setCurrentActivity] = useState(activity);

    const handleDelete = () => {
        // 第一次确认
        if (!window.confirm('确定要删除该活动吗？所有相关的照片也会被删除！')) {
            return;
        }
        // 第二次确认
        if (!window.confirm('再次确认：真的要删除该活动吗？所有相关的照片也会被删除！删除后将无法恢复！')) {
            return;
        }

        fetch(`${config.backendUrl}/deleteActivity`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: activity[0]
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('活动删除成功');
                window.location.reload();
            } else {
                alert('删除失败：' + (data.detail || '未知错误'));
            }
        })
        .catch(error => {
            console.error('删除失败:', error);
            alert('删除失败');
        });
    };

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
            <td>
                <button
                    onClick={handleDelete}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={e => e.target.style.backgroundColor = '#dc3545'}
                >
                    删除该活动
                </button>
            </td>
        </tr>
    );
}

function NewActivityButton() {
    const [showForm, setShowForm] = useState(false);
    const [newActivity, setNewActivity] = useState({
        name: '',
        label: '',
        date: '',
        location: '',
        likes: 0,
        shares: 0
    });
    const [coverImage, setCoverImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // 处理图片选择
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            // 创建预览URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('name', newActivity.name);
        formData.append('label', newActivity.label);
        formData.append('date', newActivity.date);
        formData.append('location', newActivity.location);
        formData.append('likes', newActivity.likes);
        formData.append('shares', newActivity.shares);
        
        if (coverImage) {
            formData.append('cover', coverImage);
        }

        try {
            const response = await fetch(`${config.backendUrl}/addActivity`, {
                method: 'POST',
                credentials: 'include',
                body: formData // 不需要设置 Content-Type，浏览器会自动设置
            });

            const data = await response.json();
            if (data.success) {
                alert('活动添加成功');
                setShowForm(false);
                // 清理预览URL
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
                window.location.reload();
            } else {
                alert('添加失败：' + data.detail);
            }
        } catch (error) {
            console.error('添加失败:', error);
            alert('添加失败');
        }
    };

    // 组件卸载时清理预览URL
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div style={{ margin: '20px 0' }}>
            <button
                onClick={() => setShowForm(!showForm)}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                {showForm ? '取消添加' : '添加新活动'}
            </button>

            {showForm && (
                <div style={{
                    border: '1px solid #ddd',
                    padding: '20px',
                    borderRadius: '8px',
                    marginTop: '10px'
                }}>

<div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px' }}>
                            活动封面：
                        </label>
                        <input
                            type="file"
                            // {/*.jpg .png*/}
                            accept=" image/jpeg, image/png"
                            onChange={handleImageChange}
                            style={{ marginBottom: '10px' }}
                        />
                        {previewUrl && (
                            <div style={{ marginTop: '10px' }}>
                                <img
                                    src={previewUrl}
                                    alt="封面预览"
                                    style={{
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        )}
                    </div>


                    <div style={{ marginBottom: '10px' }}>
                        <label>活动名称（仅接受ASCII字符）：</label>
                        <input
                            type="text"
                            value={newActivity.name}
                            onChange={e => setNewActivity({...newActivity, name: e.target.value})}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>活动显示名：</label>
                        <input
                            type="text"
                            value={newActivity.label}
                            onChange={e => setNewActivity({...newActivity, label: e.target.value})}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>活动日期：</label>
                        <input
                            type="date"
                            value={newActivity.date}
                            onChange={e => setNewActivity({...newActivity, date: e.target.value})}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>活动地点：</label>
                        <input
                            type="text"
                            value={newActivity.location}
                            onChange={e => setNewActivity({...newActivity, location: e.target.value})}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        确认添加
                    </button>
                </div>
            )}
        </div>
    );
}


export default withAuth(ActivityManage);