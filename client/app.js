let html5QrCode;
let lastScanTime = 0;
const scanCooldown = 3000; // prevent double scan

document.addEventListener("DOMContentLoaded", () => {
  const cameraSelect = document.getElementById("camera-select");
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const exportBtn = document.getElementById("export-btn");
  const clearBtn = document.getElementById("clear-list");
  const refreshBtn = document.getElementById("refresh-list");

  // Load available cameras
  Html5Qrcode.getCameras().then(devices => {
    devices.forEach(device => {
      const option = document.createElement("option");
      option.value = device.id;
      option.text = device.label || `Camera ${cameraSelect.length + 1}`;
      cameraSelect.appendChild(option);
    });
  }).catch(err => console.error("Camera fetch failed:", err));

  // Start Camera
  startBtn.addEventListener("click", () => {
    const cameraId = cameraSelect.value;
    if (!cameraId) {
      alert("Please select a camera first!");
      return;
    }

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    html5QrCode.start(
      cameraId,
      { fps: 10, qrbox: 250 },
      qrCodeMessage => {
        const now = Date.now();
        if (now - lastScanTime > scanCooldown) {
          recordAttendance(qrCodeMessage);
          lastScanTime = now;
        }
      }
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

  // Refresh List (fetch from backend)
  refreshBtn.addEventListener("click", () => {
    loadAttendance();
  });

  // Clear List (backend + frontend)
  clearBtn.addEventListener("click", async () => {
    await fetch("/attendance", { method: "DELETE" });
    loadAttendance();
  });

  // Export Attendance
  exportBtn.addEventListener("click", () => {
    window.location.href = "/export";
  });

  // Load attendance on page load
  loadAttendance();
});

// --- Attendance ---
async function recordAttendance(name) {
  const res = await fetch("/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  addToList(data);
  updateStats();
}

async function loadAttendance() {
  const res = await fetch("/attendance");
  const data = await res.json();
  const list = document.getElementById("attendance-list");
  list.innerHTML = "";
  data.forEach(entry => addToList(entry));
  updateStats();
}

function addToList(entry) {
  const list = document.getElementById("attendance-list");
  const item = document.createElement("li");
  item.textContent = `${entry.name} - ${entry.date} at ${entry.time}`;
  list.appendChild(item);
}

function updateStats() {
  fetch("/attendance").then(res => res.json()).then(data => {
    const total = data.length;
    const percent = total > 0 ? Math.round((total / 50) * 100) : 0; // Example: out of 50 teachers
    document.getElementById("total-attendees").textContent = total;
    document.getElementById("average-percent").textContent = percent + "%";
  });
}
