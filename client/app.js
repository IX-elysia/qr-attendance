let html5QrCode;

// Switch between tabs
function showSection(id) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const qrReader = document.getElementById("qr-reader");
  const attendanceList = document.getElementById("attendance-list");
  const addManualBtn = document.getElementById("add-manual");
  const clearBtn = document.getElementById("clear-attendance");
  const exportBtn = document.getElementById("export-btn");
  const generateBtn = document.getElementById("generate-qr");
  const qrcodeDiv = document.getElementById("qrcode");

  // Start Camera
  startBtn.addEventListener("click", () => {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("qr-reader");
    }
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 300, height: 300 } },
      (decodedText) => {
        addAttendance(decodedText);
      },
      (err) => {
        console.warn(err);
      }
    ).catch(err => console.error("Camera start failed:", err));
  });

  // Stop Camera
  stopBtn.addEventListener("click", () => {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        console.log("Camera stopped");
      }).catch(err => console.error("Stop failed", err));
    }
  });

  // Add Manual Attendance
  addManualBtn.addEventListener("click", () => {
    const name = document.getElementById("manual-name").value.trim();
    if (name) {
      addAttendance(name);
      document.getElementById("manual-name").value = "";
    }
  });

  // Clear Attendance
  clearBtn.addEventListener("click", () => {
    attendanceList.innerHTML = "";
  });

  // Export Attendance
  exportBtn.addEventListener("click", () => {
    const rows = [];
    document.querySelectorAll("#attendance-list li").forEach(li => rows.push([li.textContent]));
    if (rows.length === 0) {
      alert("No attendance data to export!");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "attendance.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Generate QR
  generateBtn.addEventListener("click", () => {
    const text = document.getElementById("qr-input").value.trim();
    if (!text) {
      alert("Enter a name to generate QR");
      return;
    }
    qrcodeDiv.innerHTML = "";
    new QRCode(qrcodeDiv, {
      text: text,
      width: 200,
      height: 200
    });
  });

  // Add to Attendance List
  function addAttendance(name) {
    const li = document.createElement("li");
    li.textContent = `${name} — ${new Date().toLocaleString()}`;
    attendanceList.appendChild(li);
  }
});
