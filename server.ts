/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS for all origins, methods, and headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API REQUEST] ${new Date().toISOString()} ${req.method} ${req.url}`);
  }
  next();
});

const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyV9BGsA3xI8cprTcvFFXvFZbcR4nHNXPDzbSg2P4aQMK4PGOnFArxezIdsvh8L2yvYYg/exec';

// API đồng bộ dữ liệu vào Google Sheet qua Google Apps Script Webhook
app.post('/api/sync-sheet', async (req, res) => {
  try {
    const { webhookUrl, payload } = req.body;
    const targetUrl = (webhookUrl && webhookUrl.trim().startsWith('http'))
      ? webhookUrl.trim()
      : DEFAULT_WEBHOOK_URL;

    const dataToSend = payload || req.body;

    // Node.js fetch follows 302 redirects automatically without browser CORS restrictions
    const gResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    const text = await gResponse.text();
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = { status: 'success', raw: text };
    }

    if (parsedData.status === 'error') {
      console.error('Google Apps Script báo lỗi:', parsedData.message);
      res.status(400).json({
        status: 'error',
        message: parsedData.message || 'Lỗi khi ghi vào Google Sheet',
        details: parsedData,
      });
      return;
    }

    console.log(`Đã ghi thành công chuyến xe vào dòng ${parsedData.rowNumber || 'mới'} trên Google Sheet!`);
    res.status(200).json({
      status: 'success',
      message: parsedData.message || 'Đã đồng bộ lên Google Sheet thành công!',
      rowNumber: parsedData.rowNumber,
      details: parsedData,
    });
  } catch (error: any) {
    console.error('Lỗi khi chuyển tiếp dữ liệu lên Google Sheet:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Không thể đồng bộ vào Google Sheet',
    });
  }
});

// Endpoint kiểm tra trạng thái webhook
app.get('/api/test-sheet', async (req, res) => {
  try {
    const gResponse = await fetch(DEFAULT_WEBHOOK_URL, {
      method: 'GET',
    });
    const data = await gResponse.json();
    res.json({ status: 'online', data });
  } catch (error: any) {
    res.status(500).json({ status: 'offline', error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In dev: mount vite.middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production: serve dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

startServer();
