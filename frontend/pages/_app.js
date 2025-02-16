import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }) {
    return (
        //在每一个页面中使用AuthProvider组件包裹，以便在所有页面之间共享用户的登录状态。
        <AuthProvider>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default MyApp;