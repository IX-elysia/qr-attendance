const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const ExcelJS = require("exceljs");

const app = express();
const PORT = process.env.PORT || 3000;

let attendance = [];

// --- Load saved attendance ---
const dataFile = path.join(__dirname, "attendance.json");
if (fs.existsSync(dataFile)) {
  attendance = JSON.parse(fs.readFileSync(dataFile));
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client")));

// --- Routes for pages ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html")); // Scanner
});

app.get("/generator", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "generator.html")); // QR Generator
});

app.get("/export-page", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "export.html")); // Export page
});

// --- Helper: Save attendance ---
function saveAttendance() {
  fs.writeFileSync(dataFile, JSON.stringify(attendance, null, 2));
}

// --- Record attendance ---
app.post("/attendance", (req, res) => {
  const { name } = req.body;

  const now = new Date();
  const date = now.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const time = now.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const entry = { name, date, time };
  attendance.push(entry);
  saveAttendance();

  res.json(entry);
});

// --- Get attendance list ---
app.get("/attendance", (req, res) => {
  res.json(attendance);
});

// --- Clear attendance ---
app.delete("/attendance", (req, res) => {
  attendance = [];
  saveAttendance();
  res.sendStatus(200);
});

// --- Export attendance to Excel ---
app.get("/export", async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance");

  worksheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 15 },
  ];

  attendance.forEach((record) => {
    worksheet.addRow(record);
  });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=attendance.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  await workbook.xlsx.write(res);
  res.end();
});

// --- Start server ---
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
