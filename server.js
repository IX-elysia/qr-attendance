const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../client")));

let attendance = [];

// Load saved attendance if exists
const FILE = "attendance.json";
if (fs.existsSync(FILE)) {
  attendance = JSON.parse(fs.readFileSync(FILE));
}

// Get attendance
app.get("/attendance", (req, res) => {
  res.json(attendance);
});

// Add name
app.post("/attendance", (req, res) => {
  const { name } = req.body;
  if (name && !attendance.includes(name)) {
    attendance.push(name);
    fs.writeFileSync(FILE, JSON.stringify(attendance));
  }
  res.json({ success: true });
});

// Export Excel
app.get("/export", (req, res) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([["Name"], ...attendance.map(n => [n])]);
  xlsx.utils.book_append_sheet(wb, ws, "Attendance");
  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", "attachment; filename=attendance.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// ✅ Serve index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
