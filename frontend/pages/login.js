import {useState, useEffect} from 'react';
import config from '../config';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { user, setUser, loading } = useAuth();

    // 如果已经登录，跳转到admin页面
    useEffect(() => {
        if (user) {
            router.push('/admin');
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

    // 如果正在加载，显示加载状态
    if (loading) {
        return <div>加载中...</div>;
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