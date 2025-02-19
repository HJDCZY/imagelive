import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

export default function AccountManage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [pageReady, setPageReady] = useState(false);
    // 检查登录状态
    const { user, setUser, loading: authLoading } = useAuth();  // 从 AuthContext 获取 loading 状态
    useEffect(() => {
        if (!authLoading) {  // 使用 AuthContext 的 loading 状态
            setLoading(false);  // 更新组件的 loading 状态
            if (!user) {
                router.push('/login');
            } else {
                setPageReady(true);
            }
        }
    }, [user, authLoading, router]);  // 依赖项改为 authLoading

    // 如果页面还没准备好或正在加载，显示加载状态
    if (authLoading || !pageReady) {
        return <div>Loading...</div>;
    }

    function changePassword( ) {
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        fetch(`${config.backendUrl}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ oldPassword, newPassword }),
            credentials: 'include'
        }).then(response => 
            response.json().then(data => {
                if (response.ok) {
                    alert('成功更改密码');
                } else {
                    alert('更改密码失败，原因：' + data.detail);
                }
            })
        )
    }

    // 只在页面准备就绪后渲染实际内容
    return (
        <div>
            <h1>Account Manage</h1>
            <div id='change-password' style={{ 
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '400px',
            margin: '20px auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <label htmlFor='old-password' style={{ fontWeight: '500' }}>原密码</label>
            <input 
                type='password' 
                id='old-password' 
                name='old-password'
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                }}
            />
            <label htmlFor='new-password' style={{ fontWeight: '500' }}>新密码</label>
            <input 
                type='password' 
                id='new-password' 
                name='new-password'
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                }}
            />
            <button 
                onClick={changePassword}
                style={{
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={e => e.target.style.backgroundColor = '#007bff'}
            >
                修改密码
            </button>
        </div>
        </div>
    );
}
