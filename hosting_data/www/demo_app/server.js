const http = require('http');

const port = process.env.PORT || 4100;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: 'Hello from Node.js App managed by cPanel PM2!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));
});

server.listen(port, () => {
  console.log(`[DEMO APP] Server listening on port ${port}`);
});

