import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import config from './config.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    if (config.ensureHTTPS) {
        const httpsOptions = {
            key: fs.readFileSync(config.sslkeypath),
            cert: fs.readFileSync(config.sslcertpath)
        };
        createHttpsServer(httpsOptions, (req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        }).listen(config.port, config.host, (err) => {
            if (err) throw err;
            console.log(`> Ready on https://${config.host}:${config.port}`);
        });
    } else {
        createHttpServer((req, res) => {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        }).listen(config.port, config.host, (err) => {
            if (err) throw err;
            console.log(`> Ready on http://${config.host}:${config.port}`);
        });
    }
});