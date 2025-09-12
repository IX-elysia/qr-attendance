let html5QrCode;
let lastScanTime = 0;
const scanCooldown = 3000; // 3 seconds between scans

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const addManualBtn = document.getElementById("add-manual");
  const exportBtn = document.getElementById("export-btn");
  const clearBtn = document.getElementById("clear-list");
  const refreshBtn = document.getElementById("refresh-list");

  // Start Camera
  startBtn.addEventListener("click", () => {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }
    html5QrCode.start(
      { facingMode: "environment" },
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

  // Manual Input
  addManualBtn.addEventListener("click", () => {
    const manualName = document.getElementById("manual-name").value.trim();
    if (manualName) {
      recordAttendance(manualName);
      document.getElementById("manual-name").value = "";
    }
  });

  // Refresh List
  refreshBtn.addEventListener("click", () => {
    document.getElementById("attendance-list").innerHTML = "";
  });

  // Clear List
  clearBtn.addEventListener("click", () => {
    document.getElementById("attendance-list").innerHTML = "";
  });

  // Export (placeholder – backend handles real export)
  exportBtn.addEventListener("click", () => {
    alert("Export to Excel coming soon!");
  });
});

// --- Attendance ---
function recordAttendance(name) {
  const list = document.getElementById("attendance-list");
  const item = document.createElement("li");
  item.textContent = `${name} - Recorded at ${new Date().toLocaleTimeString()}`;
  list.appendChild(item);
}

// --- Tab navigation ---
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
    const target = btn.getAttribute("data-target");
    document.getElementById(target).classList.add("active");
  });
});
