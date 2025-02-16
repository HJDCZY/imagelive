//如果没有登录，跳转到login.js
//检查用户的登录状态cookie
import { useEffect, useState } from 'react';
import  config  from '../config';

export default function Admin() {
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const response = await fetch(`${config.backendUrl}/admin`, {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    // 如果已登录，获取用户列表
                    const data = await response.json();
                    setUsers(data.users);
                } else {
                    // 如果未登录，跳转到登录页面
                    window.location.href = '/login';
                }
            } catch (error) {
                setMessage('获取用户列表失败：服务器连接错误');
                console.error('Admin error:', error);
            } finally {
                setLoading(false);
            }
        }

        checkLogin();
    }, []);

    return (
        <div>
            <h1>Admin</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {users.map(user => (
                        <li key={user.id}>{user.username}</li>
                    ))}
                </ul>
            )}
            <p>{message}</p>
        </div>
    );
}