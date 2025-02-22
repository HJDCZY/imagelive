import { AuthProvider } from '../contexts/AuthContext';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Head>
                <meta name="referrer" content="no-referrer-when-downgrade" />
            </Head>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default MyApp;