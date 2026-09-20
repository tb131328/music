const http = require('http');
const https = require('https');
http.createServer((req, res) => {
  const targetUrl = decodeURIComponent(req.url.slice(1));
  if (!targetUrl.startsWith('http')) { res.writeHead(400); res.end(); return; }
  const mod = targetUrl.startsWith('https') ? https : http;
  mod.get(targetUrl, {
    headers: { 'referer': 'https://music.163.com', 'user-agent': 'Mozilla/5.0' }
  }, (pr) => {
    res.writeHead(pr.statusCode, { ...pr.headers, 'access-control-allow-origin': '*' });
    pr.pipe(res);
  }).on('error', e => { res.writeHead(500); res.end(e.message); });
}).listen(3001, () => console.log('CDN proxy running on port 3001'));
