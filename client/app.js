const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const manualAddBtn = document.getElementById("manualAdd");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");

const attendanceList = document.getElementById("attendanceList");
const qrcodeDiv = document.getElementById("qrcode");

let html5QrCode;

// Load attendance
async function loadAttendance() {
  const res = await fetch("/attendance");
  const data = await res.json();
  attendanceList.innerHTML = "";
  data.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} - ${entry.date} ${entry.time}`;
    attendanceList.appendChild(li);
  });
}

// Add attendance
async function addAttendance(name) {
  const res = await fetch("/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (res.ok) loadAttendance();
}

// Clear attendance
clearBtn.addEventListener("click", async () => {
  await fetch("/attendance", { method: "DELETE" });
  loadAttendance();
});

// Refresh
refreshBtn.addEventListener("click", loadAttendance);

// Manual add
manualAddBtn.addEventListener("click", () => {
  const name = document.getElementById("manualName").value.trim();
  if (name) addAttendance(name);
});

// Export (Excel)
exportBtn.addEventListener("click", () => {
  window.location.href = "/export";
});

// Start Camera
startBtn.addEventListener("click", () => {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    decodedText => addAttendance(decodedText),
    err => console.warn(err)
  ).catch(err => console.error("Camera start failed:", err));
});

// Stop Camera
stopBtn.addEventListener("click", () => {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      console.log("Camera stopped");
    }).catch(err => console.error("Stop failed:", err));
  }
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
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  downloadBtn.style.display = "inline-block";

  setTimeout(() => {
    const qrCanvas = qrcodeDiv.querySelector("canvas");
    if (qrCanvas) {
      downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.download = `${text}_qr.png`;
        link.href = qrCanvas.toDataURL("image/png");
        link.click();
      };
    }
  }, 500);
});

// Initial load
loadAttendance();
