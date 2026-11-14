import http from 'node:http';

const port = Number(process.env.PORT ?? '3000');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT phải là số nguyên từ 1 đến 65535');
}

const html = String.raw`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ứng dụng luyện automation</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; color: #172033; }
    main { max-width: 460px; margin: auto; }
    label { display: block; margin-top: 16px; }
    input { box-sizing: border-box; width: 100%; padding: 10px; margin-top: 6px; }
    button { padding: 10px 18px; margin-top: 20px; cursor: pointer; }
    [data-testid="login-error"] { color: #a21515; }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
  <main>
    <h1>Đăng nhập ứng dụng học tập</h1>
    <form id="login-form" novalidate>
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="username">

      <label for="password">Mật khẩu</label>
      <input id="password" name="password" type="password" autocomplete="current-password">

      <button type="submit" data-testid="login-button">Đăng nhập</button>
      <p role="alert" data-testid="login-error" hidden></p>
    </form>

    <section id="dashboard" hidden>
      <h2 data-testid="dashboard-heading">Chào mừng</h2>
      <p>Bạn đã hoàn tất luồng đăng nhập học tập.</p>
    </section>
  </main>

  <script>
    const form = document.querySelector('#login-form');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    const button = document.querySelector('[data-testid="login-button"]');
    const error = document.querySelector('[data-testid="login-error"]');
    const dashboard = document.querySelector('#dashboard');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      error.hidden = true;
      error.textContent = '';
      button.disabled = true;

      setTimeout(() => {
        let message = '';

        if (email === '' || password === '') {
          message = 'Vui lòng nhập email và mật khẩu';
        } else if (email !== 'user@example.test' || password !== 'Password123!') {
          message = 'Email hoặc mật khẩu không đúng';
        } else {
          form.hidden = true;
          dashboard.hidden = false;
        }

        if (message !== '') {
          error.textContent = message;
          error.hidden = false;
        }
        button.disabled = false;
      }, 150);
    });
  </script>
</body>
</html>`;

const server = http.createServer((request, response) => {
  const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;

  if (request.method === 'GET' && (path === '/' || path === '/login')) {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end(html);
    return;
  }

  if (request.method === 'GET' && path === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ready: true }));
    return;
  }

  if (path === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Không có đường dẫn này trong ứng dụng học tập');
});

server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Mở http://127.0.0.1:${port}/login để luyện tập`);
});
