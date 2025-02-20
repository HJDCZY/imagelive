import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';


// 账号管理
// 图片管理
// 图片上传
// 活动管理
//页面的翻译

const pageMap = {
    accountManage: '账号管理',
    imageManage: '图片管理',
    imageUpload: '图片上传',
    activityManage: '活动管理'
};

//每30秒检查一次登录状态，如果未登录，强制刷新页面
setInterval(() => {
    fetch(`${config.backendUrl}/check-login`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Origin': window.location.origin
        }

    }).then(response => {
        if (!response.ok) {
            window.location.reload();
        }
    }
    );
}, 30000);

export default function Admin() {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageReady, setPageReady] = useState(false);  // 添加页面准备状态
    const { user, setUser, loading: authLoading } = useAuth();  // 从 AuthContext 获取 loading 状态
    const [currentPage, setCurrentPage] = useState('accountManage');

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
        <div style={{ display: 'flex' }}>
            <LeftNavBar setCurrentPage={setCurrentPage} />
            <div style={{ flex: 1, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ marginRight: '20px' }}>当前用户：{user}</span>
                        <span style={{ marginRight: '20px' }}>当前页面：{pageMap[currentPage]}</span>
                    </div>
                <button 
                    onClick={logout}
                    style={{
                        
                        padding: '10px 20px',
                        cursor: 'pointer',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        minWidth: '100px'
                    }}
                    onMouseEnter={e => {
                        e.target.style.backgroundColor = '#e0e0e0';
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={e => {
                        e.target.style.backgroundColor = '#f0f0f0';
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    退出登录
                </button>
                </div>
                <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 80px)' }}>
                    {currentPage && (
                        <iframe
                            src={`/admins/${currentPage}`}
                            
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}

                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// 左侧竖直导航栏组件
function LeftNavBar({ setCurrentPage }) {
    const handleNavClick = (page) => {
        setCurrentPage(page);
    };

    return (
        <div style={{
            width: '200px',
            height: '100vh',
            backgroundColor: '#f0f0f0',
            padding: '20px',
            borderRight: '1px solid #ddd',
            overflowY: 'auto'
        }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li onClick={() => handleNavClick('accountManage')} style={navItemStyle}>
                    账号管理
                </li>
                <li onClick={() => handleNavClick('imageManage')} style={navItemStyle}>
                    图片管理
                </li>
                <li onClick={() => handleNavClick('imageUpload')} style={navItemStyle}>
                    图片上传
                </li>
                <li onClick={() => handleNavClick('activityManage')} style={navItemStyle}>
                    活动管理
                </li>
            </ul>
        </div>
    );
}

const navItemStyle = {
    padding: '10px',
    margin: '5px 0',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: '#e0e0e0'
    }
};