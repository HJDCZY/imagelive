import {useState, useEffect} from 'react';
import config from '../config';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import 'whatwg-fetch';

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { user, setUser, loading } = useAuth();

    // 如果已经登录，跳转到admin页面
    // useEffect(() => {
    //     if (user) {
    //         router.push('/admin');
    //     }
    // }, [user, router]);
    useEffect(() => {
        if (user) {
            const returnUrl = router.query.returnUrl || '/admin';
            router.push(decodeURIComponent(returnUrl));
        }
    }, [user, router]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
    
            const response = await fetch(`${config.backendUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
                credentials: 'include'
            });
    
            const data = await response.json();
            
            if (response.ok) {
                setMessage('登录成功');
                console.log('Login success:', data);
                setUser(data.username);

                //检查cookie是否设置成功
                // console.log(document.cookie);

                // 更新用户状态
                // 登录成功后跳转
                // router.push('/admin');
                // 登录成功后跳转到返回URL
                const returnUrl = router.query.returnUrl || '/admin';
                router.push(decodeURIComponent(returnUrl));
            } else if (response.status === 400) {
                setMessage("登录失败："+data.detail );
            } else {
                setMessage('登录失败: ' + (data.detail || '未知错误'));
            }
        } catch (error) {
            setMessage('登录失败：服务器连接错误');
            console.error('Login error:', error);
        }
    }

    // 如果正在加载，显示加载状态
    if (loading) {
        return <div>加载中...</div>;
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <form 
                onSubmit={handleSubmit}
                style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    width: '100%',
                    maxWidth: '400px'
                }}
            >
                <h1 style={{
                    textAlign: 'center',
                    color: '#333',
                    marginBottom: '2rem'
                }}>登录</h1>
                <div style={{
                    marginBottom: '1rem'
                }}>
                    <input
                        type="text"
                        placeholder="用户名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                    />
                </div>
                <div style={{
                    marginBottom: '1.5rem'
                }}>
                    <input
                        type="password"
                        placeholder="密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                    />
                </div>
                <button 
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={e => e.target.style.backgroundColor = '#0056b3'}
                    onMouseOut={e => e.target.style.backgroundColor = '#007bff'}
                >
                    登录
                </button>
                <p style={{
                    textAlign: 'center',
                    marginTop: '1rem',
                    color: message.includes('成功') ? '#28a745' : '#dc3545'
                }}>
                    {message}
                </p>
            </form>
        </div>
    );
}