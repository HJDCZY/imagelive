import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import config from './config.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const httpsOptions = {
    key: fs.readFileSync('/hjdczy.top/cert/Nginx/hjdczy.top.key'),
    cert: fs.readFileSync('/hjdczy.top/cert/Nginx/hjdczy.top.crt')
};

app.prepare().then(() => {
    createHttpsServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(47839, (err) => {
        if (err) throw err;
        console.log('> Ready on https://hjdczy.top:47839');
    });
});