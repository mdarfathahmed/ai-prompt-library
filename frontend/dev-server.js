const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DEFAULT_FRONTEND_PORT = 5500;
const requestedPort = Number(process.env.PORT) || DEFAULT_FRONTEND_PORT;
let currentPort = requestedPort;
const SERVER_HOST = process.env.HOST || '0.0.0.0';
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://127.0.0.1:8000';
const FRONTEND_DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function proxyApi(req, res) {
  const target = new URL(req.url, BACKEND_ORIGIN);
  const proxyReq = http.request(
    target,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host
      }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Backend is unreachable on http://127.0.0.1:8000' }));
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  if (req.url.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }

  const pathname = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(FRONTEND_DIR, safePath);

  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  sendFile(res, filePath);
});

function startServer(port) {
  currentPort = port;
  server.listen(port, SERVER_HOST, () => {
    console.log(`Frontend running at http://127.0.0.1:${port}`);
    console.log(`Proxying /api/* to ${BACKEND_ORIGIN}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(currentPort) + 1;
    console.warn(`Port ${currentPort} is in use. Retrying on ${nextPort}...`);
    setTimeout(() => startServer(nextPort), 100);
    return;
  }

  throw err;
});

startServer(requestedPort);
