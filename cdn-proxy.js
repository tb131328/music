const http = require('http');
const https = require('https');

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const ALLOWED_HOST = /(^|\.)music\.126\.net$/;
const MAX_REDIRECTS = 5;

function proxyRequest(targetUrl, req, res, redirectCount = 0) {
  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    res.writeHead(400);
    res.end('Invalid target URL');
    return;
  }

  if (
    !['http:', 'https:'].includes(target.protocol) ||
    (target.hostname !== 'music.163.com' && !ALLOWED_HOST.test(target.hostname))
  ) {
    res.writeHead(403);
    res.end('Target host is not allowed');
    return;
  }

  const transport = target.protocol === 'https:' ? https : http;
  const request = transport.request(
    target,
    {
      method: req.method,
      headers: {
        referer: 'https://music.163.com',
        'user-agent': 'Mozilla/5.0',
        ...(req.headers.range ? { range: req.headers.range } : {}),
        ...(req.headers['if-range'] ? { 'if-range': req.headers['if-range'] } : {}),
      },
    },
    upstream => {
      const location = upstream.headers.location;
      if (REDIRECT_STATUSES.has(upstream.statusCode) && location) {
        upstream.resume();
        if (redirectCount >= MAX_REDIRECTS) {
          res.writeHead(502);
          res.end('Too many upstream redirects');
          return;
        }
        proxyRequest(new URL(location, target).href, req, res, redirectCount + 1);
        return;
      }

      res.writeHead(upstream.statusCode, {
        ...upstream.headers,
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, HEAD, OPTIONS',
        'access-control-allow-headers': 'Range, If-Range, If-None-Match',
        'access-control-expose-headers':
          'Accept-Ranges, Content-Length, Content-Range',
      });
      upstream.pipe(res);
    }
  );

  request.on('error', error => {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    res.writeHead(502);
    res.end(error.message);
  });
  request.end();
}

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, HEAD, OPTIONS',
        'access-control-allow-headers': 'Range, If-Range, If-None-Match',
      });
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD, OPTIONS' });
      res.end();
      return;
    }

    let targetUrl;
    try {
      targetUrl = decodeURIComponent(req.url.slice(1));
    } catch {
      res.writeHead(400);
      res.end('Malformed target URL');
      return;
    }

    proxyRequest(targetUrl, req, res);
  })
  .listen(3001, () => console.log('CDN proxy running on port 3001'));
