import {useState, useEffect} from 'react';
import config from '../config';
import { useRouter } from 'next/router';

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    // 组件加载时检查登录状态
    useEffect(() => {
        // 检查是否已经登录（比如检查cookie或localStorage）
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${config.backendUrl}/check-login`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    router.push('/admin');
                }
            } catch (error) {
                console.error('检查登录状态失败:', error);
            }
        };

        checkLoginStatus();
    }, []);

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
                // 登录成功后跳转
                router.push('/admin');
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

    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
            <p>{message}</p>
        </form>
    );
}