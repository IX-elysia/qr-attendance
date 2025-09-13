let html5QrCode;
let isScanning = false;
let lastScanTime = 0;

const scanWarning = document.getElementById("scan-warning");
const cameraSelect = document.getElementById("camera-select");
const startBtn = document.getElementById("start-scan");
const stopBtn = document.getElementById("stop-scan");
const clearBtn = document.getElementById("clear-attendance");

async function initCameras() {
  try {
    const devices = await Html5Qrcode.getCameras();
    cameraSelect.innerHTML = "";

    devices.forEach((device, i) => {
      const option = document.createElement("option");
      option.value = device.id;
      option.text = device.label || `Camera ${i + 1}`;
      cameraSelect.appendChild(option);
    });

    if (devices.length === 0) {
      scanWarning.textContent = "⚠️ No camera found!";
    }
  } catch (err) {
    console.error("Camera init error:", err);
    scanWarning.textContent = "⚠️ Unable to access cameras.";
  }
}

function startScanner() {
  if (isScanning) return;

  const cameraId = cameraSelect.value;
  html5QrCode = new Html5Qrcode("reader");

  html5QrCode
    .start(
      cameraId,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => handleScan(decodedText),
      (errorMsg) => {
        // console.log("Scan error:", errorMsg);
      }
    )
    .then(() => {
      isScanning = true;
      scanWarning.textContent = "📷 Scanner started. Ready to scan!";
    })
    .catch((err) => {
      console.error("Scanner start error:", err);
      scanWarning.textContent = "⚠️ Failed to start scanner.";
    });
}

function stopScanner() {
  if (!isScanning || !html5QrCode) return;

  html5QrCode
    .stop()
    .then(() => {
      isScanning = false;
      scanWarning.textContent = "⏹ Scanner stopped.";
    })
    .catch((err) => {
      console.error("Stop error:", err);
    });
}

async function handleScan(decodedText) {
  const now = Date.now();
  if (now - lastScanTime < 2000) return; // prevent double scan
  lastScanTime = now;

  scanWarning.textContent = `✅ Scanned: ${decodedText}`;

  try {
    const response = await fetch("/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: decodedText }),
    });

    if (!response.ok) throw new Error("Failed to save attendance");

    const data = await response.json();
    console.log("Attendance saved:", data);
  } catch (err) {
    console.error("Save error:", err);
    scanWarning.textContent = "⚠️ Failed to save attendance!";
  }
}

clearBtn.addEventListener("click", async () => {
  try {
    await fetch("/attendance", { method: "DELETE" });
    scanWarning.textContent = "🗑 Attendance cleared.";
  } catch (err) {
    console.error("Clear error:", err);
    scanWarning.textContent = "⚠️ Failed to clear attendance.";
  }
});

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

// Initialize cameras on page load
initCameras();
