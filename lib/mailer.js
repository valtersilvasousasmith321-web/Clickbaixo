'use strict';
const net = require('net');
const tls = require('tls');

function cfg() {
  return {
    HOST: process.env.SMTP_HOST || '',
    PORT: Number(process.env.SMTP_PORT || 587),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  };
}

function isConfigured() {
  const c = cfg();
  return !!(c.HOST && c.USER && c.PASS && c.FROM);
}

function readLine(socket) {
  return new Promise((resolve, reject) => {
    const onData = (buf) => { cleanup(); resolve(buf.toString('utf8')); };
    const onErr = (e) => { cleanup(); reject(e); };
    function cleanup() { socket.removeListener('data', onData); socket.removeListener('error', onErr); }
    socket.once('data', onData);
    socket.once('error', onErr);
  });
}

async function talk(socket, cmd) {
  if (cmd !== null) socket.write(cmd + '\r\n');
  const resp = await readLine(socket);
  return resp;
}

async function sendMail({ to, subject, text, html }) {
  if (!isConfigured()) return false;
  const c = cfg();
  try {
    let socket;
    if (c.PORT === 465) {
      socket = tls.connect({ host: c.HOST, port: c.PORT, servername: c.HOST });
      await new Promise((res, rej) => { socket.once('secureConnect', res); socket.once('error', rej); });
    } else {
      socket = net.connect({ host: c.HOST, port: c.PORT });
      await new Promise((res, rej) => { socket.once('connect', res); socket.once('error', rej); });
    }
    await readLine(socket); // greeting
    await talk(socket, `EHLO clickbaixo.local`);
    if (c.PORT !== 465) {
      await talk(socket, 'STARTTLS');
      socket = await new Promise((resolve, reject) => {
        const upgraded = tls.connect({ socket, servername: c.HOST }, () => resolve(upgraded));
      });
      await talk(socket, `EHLO clickbaixo.local`);
    }
    await talk(socket, 'AUTH LOGIN');
    await talk(socket, Buffer.from(c.USER).toString('base64'));
    await talk(socket, Buffer.from(c.PASS).toString('base64'));
    await talk(socket, `MAIL FROM:<${c.FROM}>`);
    await talk(socket, `RCPT TO:<${to}>`);
    await talk(socket, 'DATA');
    const boundary = 'clickbaixo-' + Date.now();
    const bodyHtml = html || `<p>${(text || '').replace(/\n/g, '<br>')}</p>`;
    const msg = [
      `From: Clickbaixo <${c.FROM}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      text || '',
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      bodyHtml,
      '',
      `--${boundary}--`,
      '.',
    ].join('\r\n');
    await talk(socket, msg);
    await talk(socket, 'QUIT');
    socket.end();
    return true;
  } catch (e) {
    console.error('[erro] envio de e-mail falhou:', e.message);
    return false;
  }
}

module.exports = { isConfigured, sendMail };
