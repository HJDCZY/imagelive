import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Admin() {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageReady, setPageReady] = useState(false);  // 添加页面准备状态
    const { user, setUser, loading: authLoading } = useAuth();  // 从 AuthContext 获取 loading 状态

    // 检查登录状态
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


    function logout() {
        fetch(`${config.backendUrl}/logout`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            }
        }).then(response => {
            if (response.ok) {
                setUser(null);
                router.push('/login');
            }
        });
    }

    // 如果页面还没准备好或正在加载，显示加载状态
    if (authLoading || !pageReady) {
        return <div>Loading...</div>;
    }

    // 只在页面准备就绪后渲染实际内容
    return (
        <div>
            <h1>Admin</h1>
            <button onClick={logout}>Logout</button> 
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.username}</li>
                ))}
            </ul>
            <p>{message}</p>
        </div>
    );
}