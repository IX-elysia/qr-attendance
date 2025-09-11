const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "client")));

let attendance = [];

// Load existing attendance
if (fs.existsSync("attendance.json")) {
  attendance = JSON.parse(fs.readFileSync("attendance.json"));
}

// Record attendance
app.post("/attendance", (req, res) => {
  const { name } = req.body;
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  attendance.push({ name, time });
  fs.writeFileSync("attendance.json", JSON.stringify(attendance));
  res.json({ message: "Attendance recorded", name, time });
});

// Get attendance list
app.get("/attendance", (req, res) => {
  res.json(attendance);
});

// Clear attendance
app.delete("/attendance", (req, res) => {
  attendance = [];
  fs.writeFileSync("attendance.json", JSON.stringify(attendance));
  res.json({ message: "Attendance cleared" });
});

// Export attendance to Excel
app.get("/export", (req, res) => {
  const ExcelJS = require("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");

  sheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Time", key: "time", width: 20 }
  ];

  sheet.addRows(attendance);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=attendance.xlsx");

  workbook.xlsx.write(res).then(() => res.end());
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
