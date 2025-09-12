let html5QrCode;

document.getElementById("start-camera").addEventListener("click", () => {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {
      recordAttendance(qrCodeMessage);
    }
  ).catch(err => console.error("Camera start failed:", err));
});

document.getElementById("stop-camera").addEventListener("click", () => {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      console.log("Camera stopped");
    }).catch(err => console.error("Stop failed:", err));
  }
});

// --- Manual input + Attendance functions ---
function recordAttendance(name) {
  const list = document.getElementById("attendance-list");
  const item = document.createElement("li");
  item.textContent = `${name} - Recorded at ${new Date().toLocaleTimeString()}`;
  list.appendChild(item);
}
