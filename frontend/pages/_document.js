import config from '../config';
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
      <Html>
        <Head>
          <link rel="icon" type="image/jpeg" href={config.faviconpath} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
}