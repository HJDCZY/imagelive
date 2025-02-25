import { AuthProvider } from '../contexts/AuthContext';
import Head from 'next/head';
import config from '../config'

function MyApp({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Head>
                <meta name="referrer" content="no-referrer-when-downgrade" />
                <title>{config.headname}</title>
            </Head>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default MyApp;