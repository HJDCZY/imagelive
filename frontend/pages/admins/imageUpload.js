import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';
import withAuth from '../../contexts/withAuth';


function ImageUpload({ user }) {  // 从 withAuth 获取 user
    const [activities, setActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);


    // 获取活动列表
    useEffect(() => {
        fetchActivities().then(data => setActivities(data));
    }, []);

    // 清理预览URL
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    // 如果页面未准备好，显示加载状态
    // if (!pageReady) {
    //     return (
    //         <div style={{
    //             display: 'flex',
    //             justifyContent: 'center',
    //             alignItems: 'center',
    //             height: '100vh',
    //             fontSize: '1.2rem',
    //             color: '#666'
    //         }}>
    //             正在加载...
    //         </div>
    //     );
    // }

    // 获取活动列表
    // useEffect(() => {
    //     fetchActivities().then(data => setActivities(data));
    // }, []);

    // 处理文件选择
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        
        // 生成预览URL
        const urls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
    };

    // 处理文件上传
    const handleUpload = async () => {
        if (!selectedActivity) {
            alert('请选择活动');
            return;
        }
        if (selectedFiles.length === 0) {
            alert('请选择要上传的图片');
            return;
        }

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        formData.append('activity_name', selectedActivity);

        try {
            const response = await uploadImages(formData);
            if (response.success) {
                alert('上传成功！');
                // 清理预览和选择的文件
                setSelectedFiles([]);
                setPreviewUrls([]);
                document.getElementById('fileInput').value = '';
            } else {
                alert('上传失败：' + (response.detail || '未知错误'));
            }
        } catch (error) {
            alert('上传失败：' + error.message);
        }
    };

    // 组件卸载时清理预览URL
    // useEffect(() => {
    //     return () => {
    //         previewUrls.forEach(url => URL.revokeObjectURL(url));
    //     };
    // }, [previewUrls]);

    return (
        <div style={{ padding: '20px' }}>
            <h1>图片上传</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="file"
                    multiple
                    accept=".jpg,.png"
                    style={{ display: 'none' }}
                    id="fileInput"
                    onChange={handleFileSelect}
                />
                <button
                    onClick={() => document.getElementById('fileInput').click()}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    选择图片
                </button>
            </div>
    
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
            }}>
                {previewUrls.map((url, index) => (
                    <div key={index} style={{
                        position: 'relative',
                        paddingTop: '100%',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <img
                            src={url}
                            alt={`预览图 ${index + 1}`}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                ))}
            </div>
    
            <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px' }}>选择所属活动：</label>
                <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        width: '200px'
                    }}
                >
                    <option value="">请选择活动</option>
                    {activities.map(({ activityName, activityLabel }) => (
                        <option key={activityName} value={activityName}>
                            {activityLabel}
                        </option>
                    ))}
                </select>
            </div>
    
            <button
                onClick={handleUpload}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                确认上传
            </button>
        </div>
    );
}

function uploadImages(formData) {
    return fetch(`${config.backendUrl}/uploadImages`, {
        method: 'POST',
        credentials: 'include',  // 添加这行以发送cookie
        headers: {
            'Accept': 'application/json',
        },
        body: formData
    })
    .then(response => response.json());
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

export default withAuth(ImageUpload);