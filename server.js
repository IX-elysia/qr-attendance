const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const ExcelJS = require("exceljs");

const app = express();
const PORT = process.env.PORT || 3000;

let attendance = [];

// Load saved attendance
const dataFile = path.join(__dirname, "attendance.json");
if (fs.existsSync(dataFile)) {
  attendance = JSON.parse(fs.readFileSync(dataFile));
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client")));

// Save attendance
function saveAttendance() {
  fs.writeFileSync(dataFile, JSON.stringify(attendance, null, 2));
}

// Record attendance
app.post("/api/attendance", (req, res) => {
  const { name } = req.body;
  const now = new Date();

  const date = now.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
  const time = now.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
  });

  const entry = { name, date, time };
  attendance.push(entry);
  saveAttendance();

  res.json(entry);
});

// Get attendance
app.get("/api/attendance", (req, res) => {
  res.json(attendance);
});

// Clear attendance
app.delete("/api/attendance", (req, res) => {
  attendance = [];
  saveAttendance();
  res.sendStatus(200);
});

// Export to Excel
app.get("/api/export", async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance");

  worksheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 15 },
  ];

  attendance.forEach(record => worksheet.addRow(record));

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

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
