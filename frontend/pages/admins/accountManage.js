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
                    //强制重新加载页面
                    window.location.reload();
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
            <AccountManageBar />
            <AddNewUser />
        </div>

            
    );
}

function changeAuth( username, newauth ) {
    //更改权限
    console.log(username, newauth);
    fetch(`${config.backendUrl}/changeAuth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, newauth }),
        credentials: 'include'
    }).then(response =>
        response.json().then(data => {
            if (response.ok) {
                alert('成功更改权限');
                //强制重新加载页面
                window.location.reload();
            } else {
                alert('更改权限失败，原因：' + data.detail);
            }
        })
    )
}

function deleteUser( username ) {
    //删除用户
    fetch(`${config.backendUrl}/deleteUser`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
        credentials: 'include'
    }).then(response =>
        response.json().then(data => {
            if (response.ok) {
                alert('成功删除用户');
                //强制重新加载页面
                window.location.reload();
            } else {
                alert('删除用户失败，原因：' + data.detail);
            }
        })
    )
}


function AccountItem({ username, auth }) {
    // 用户条目
    const [selectedAuth, setSelectedAuth] = useState(auth); // 使用当前权限作为初始值
    const authMapping = {
        'admin': '管理员',
        'contributer': '贡献者',
        'user': '普通用户'
    };


    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            margin: '10px 0',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px'
            }}>
                <span style={{ fontWeight: '500', marginRight: '10px' }}>用户: {username}</span>
                <span style={{ 
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: auth === 'admin' ? '#4CAF50' : auth === 'contributor' ? '#2196F3' : '#FFA726',
                    color: 'white',
                    fontSize: '14px'
                }}>
                    当前权限: {authMapping[auth] || '未知权限'}
                </span>
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <select
                    value={selectedAuth}
                    onChange={(e) => setSelectedAuth(e.target.value)}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                >
                    <option value="admin">管理员</option>
                    <option value="contributer">贡献者</option>
                </select>
                <button 
                    onClick={() => changeAuth(username, selectedAuth)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.backgroundColor = '#45a049'}
                    onMouseLeave={e => e.target.style.backgroundColor = '#4CAF50'}
                >
                    更改权限
                </button>
                <button 
                    onClick={() => {
                        if (window.confirm('确定要删除该用户吗？')) {
                            deleteUser(username);
                        }
                    }}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.backgroundColor = '#da190b'}
                    onMouseLeave={e => e.target.style.backgroundColor = '#f44336'}
                >
                    删除用户
                </button>
            </div>
        </div>
    );
}
function AccountManageBar() {
    // 用户列表
    const [accountList, setAccountList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${config.backendUrl}/accountList`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
        .then(response => {
            if (response.status === 400) {
                // 如果是400错误，直接返回 null
                setLoading(false);
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data) {  // 只有当 data 不为 null 时才处理
                const formattedData = data.users.map(user => ({
                    username: user[0],
                    auth: user[1]
                }));
                setAccountList(formattedData);
                console.log('格式化后的用户列表:', formattedData);
            }
            setLoading(false);
        })
        .catch(error => {
            console.error('请求失败:', error);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div>加载中...</div>;
    }

    // 如果没有数据就不渲染任何内容
    if (!accountList || accountList.length === 0) {
        return null;
    }

    return (
        <div>
            <h1>Account Manage</h1>
            <div>
                {accountList.map((account) => (
                    <AccountItem 
                        key={account.username}
                        username={account.username} 
                        auth={account.auth} 
                    />
                ))}
            </div>
        </div>
    );
}

function AddNewUser() {

    //添加新用户按钮，点击之后展开输入框
    const [showInput, setShowInput] = useState(false);

    return (
        <div>
            <button 
                onClick={() => setShowInput(!showInput)}
                style={{
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={ e => e.target.style.backgroundColor = '#007bff'}
            >
                {showInput ? '取消添加用户' : '添加新用户'}
            </button>
            {showInput && <AddNewUserInput />}
        </div>
    );
}





function AddNewUserInput () {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [auth, setAuth] = useState('user');

    function addUser( ) {
        //添加新用户

        fetch(`${config.backendUrl}/addUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, auth }),
            credentials: 'include'
        }).then(response =>
            response.json().then(data => {
                if (response.ok) {
                    alert('成功添加用户');
                    //强制重新加载页面
                    window.location.reload();
                } else {
                    alert('添加用户失败，原因：' + data.detail);
                }
            })
        )
    }
        
    return (
        <div id='add-new-user' style={{ 
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
            <label htmlFor='username' style={{ fontWeight: '500' }}>用户名</label>
            <input 
                type='text' 
                id='username' 
                name='username'
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                }}
                value={username}
                onChange={e => setUsername(e.target.value)}
            />
            <label htmlFor='password' style={{ fontWeight: '500' }}>密码</label>
            <input 
                type='password' 
                id='password' 
                name='password'
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                }}
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <label htmlFor='auth' style={{ fontWeight: '500' }}>权限</label>
            <select
                value={auth}
                onChange={(e) => setAuth(e.target.value)}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    outline: 'none'
                }}
            >
                <option value="admin">管理员</option>
                <option value="contributer">贡献者</option>
                <option value="user">普通用户</option>
            </select>
            <button 
                onClick={addUser}
                style={{
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={ e => e.target.style.backgroundColor = '#007bff'}
            >
                确认添加用户
            </button>
        </div>
    );
}

