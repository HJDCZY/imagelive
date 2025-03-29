import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';

export default function withAuth(WrappedComponent) {
    return function AuthenticatedComponent(props) {
        const router = useRouter();
        const { user, loading } = useAuth();

        useEffect(() => {
            if (!loading && !user) {
                const currentPath = encodeURIComponent(router.asPath);
                router.push(`/login?returnUrl=${currentPath}`);
            }
        }, [user, loading, router]);

        // 如果正在加载或未登录，显示加载状态
        if (loading || !user) {
            return <div>加载中...</div>;
        }

        // 已登录，渲染原始组件
        return <WrappedComponent {...props} user={user} />;
    };
}