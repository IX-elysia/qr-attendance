let qrScanner;

// Start Camera
document.getElementById("startCamera").addEventListener("click", () => {
  if (!qrScanner) {
    qrScanner = new Html5Qrcode("qr-reader");
  }
  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => recordAttendance(decodedText),
    (error) => {}
  );
});

// Stop Camera
document.getElementById("stopCamera").addEventListener("click", () => {
  if (qrScanner) {
    qrScanner.stop().then(() => {
      qrScanner.clear();
    });
  }
});

// Record attendance
async function recordAttendance(name) {
  await fetch("/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  loadAttendance();
}

// Manual Input
document.getElementById("addManual").addEventListener("click", () => {
  const name = document.getElementById("manualName").value.trim();
  if (name) {
    recordAttendance(name);
    document.getElementById("manualName").value = "";
  }
});

// Refresh Attendance
document.getElementById("refreshBtn").addEventListener("click", loadAttendance);

// Clear Attendance
document.getElementById("clearBtn").addEventListener("click", async () => {
  await fetch("/clear", { method: "POST" });
  loadAttendance();
});

// Export Attendance
document.getElementById("exportBtn").addEventListener("click", () => {
  window.location.href = "/export";
});

// Load Attendance List + Summary
async function loadAttendance() {
  const res = await fetch("/attendance");
  const data = await res.json();

  const list = document.getElementById("attendanceList");
  const summary = document.getElementById("attendanceSummary");
  list.innerHTML = "";

  const names = Object.keys(data);
  if (names.length === 0) {
    summary.textContent = "No attendance records yet.";
    return;
  }

  names.forEach(name => {
    const li = document.createElement("li");
    li.textContent = `${name} - ${data[name].time}`;
    list.appendChild(li);
  });

  summary.textContent = `Total attendees: ${names.length}`;
}

loadAttendance();
