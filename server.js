// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'attendance.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// API to add attendance
app.post('/api/attendance', (req, res) => {
  const { name, id } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const records = readData();
  const entry = {
    id: id || null,
    name: String(name).trim(),
    timestamp: new Date().toISOString(),
  };
  records.push(entry);
  try {
    writeData(records);
    return res.json({ ok: true, entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not write file' });
  }
});

// Get attendance list
app.get('/api/attendance', (req, res) => {
  const records = readData();
  res.json(records);
});

// Export to Excel
app.get('/api/export', async (req, res) => {
  const records = readData();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance');

  sheet.columns = [
    { header: 'Index', key: 'index', width: 8 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'ID', key: 'id', width: 20 },
    { header: 'Timestamp (ISO)', key: 'timestamp', width: 30 },
  ];

  records.forEach((r, i) => {
    sheet.addRow({ index: i + 1, name: r.name, id: r.id || '', timestamp: r.timestamp });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');

  await workbook.xlsx.write(res);
  res.end();
});

// Fallback to index.html for client-side
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
