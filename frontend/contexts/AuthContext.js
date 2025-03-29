//此文件是认证上下文的内容，用于管理用户的登录状态，在所有页面之间共享用户的登录状态。
import { createContext, useContext, useState, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${config.backendUrl}/check-login`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    reffererPolicy: 'no-referrer-when-downgrade'
                });
                
                // 处理所有响应状态
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.username);
                } else if (response.status === 401) {
                    // 未登录或token过期的情况
                    console.log('用户未登录或会话已过期');
                    setUser(null);
                } else {
                    // 其他错误状态
                    console.error('检查登录状态失败:', response.status);
                    setUser(null);
                }
            } catch (error) {
                // 网络错误或其他异常
                console.error('检查登录接口访问失败:', error);
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