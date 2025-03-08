const { createServer: createHttpsServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const config = require('./config');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    let server;
    
    if (config.ensureHTTPS) {
        // HTTPS 服务器配置
        const httpsOptions = {
            key: fs.readFileSync(config.sslkeypath),
            cert: fs.readFileSync(config.sslcertpath)
        };
        
        server = createHttpsServer(httpsOptions, (req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        });
        
        console.log('> Starting HTTPS server...');
    } else {
        // HTTP 服务器配置
        server = createHttpServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        });
        
        console.log('> Starting HTTP server...');
    }

    server.listen(47839, (err) => {
        if (err) throw err;
        const protocol = config.ensureHTTPS ? 'https' : 'http';
        console.log(`> Ready on ${protocol}://localhost:47839`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
        console.log('> Received SIGTERM signal, closing server...');
        server.close(() => {
            console.log('> Server closed');
            process.exit(0);
        });
    });
});