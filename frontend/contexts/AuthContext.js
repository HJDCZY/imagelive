//此文件是认证上下文的内容，用于管理用户的登录状态，在所有页面之间共享用户的登录状态。
import { createContext, useContext, useState, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 检查是否已经登录，向后端/check-login发送请求，后端检查JWT是否有效
        const checkLoginStatus = async () => {
            try {
                
                const response = await fetch(`${config.backendUrl}/check-login`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        // 添加其他必要的头信息
                        'Origin': window.location.origin
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.username);
                }
            } catch (error) {
                console.error('检查登录状态失败:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// 导出 useAuth hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};