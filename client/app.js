let html5QrCode;
let lastScanTime = 0;
const scanCooldown = 3000; // 3 seconds cooldown
const TOTAL_TEACHERS = 50; // adjust for your roster

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const exportBtn = document.getElementById("export-btn");
  const clearBtn = document.getElementById("clear-list");
  const refreshBtn = document.getElementById("refresh-list");

  // Alert banner
  const alertBanner = document.createElement("div");
  alertBanner.id = "scan-alert";
  Object.assign(alertBanner.style, {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    backgroundColor: "maroon",
    color: "white",
    fontWeight: "bold",
    borderRadius: "8px",
    display: "none",
    zIndex: "9999"
  });
  document.body.appendChild(alertBanner);

  function showAlert(message) {
    alertBanner.textContent = message;
    alertBanner.style.display = "block";
    setTimeout(() => (alertBanner.style.display = "none"), 2000);
  }

  // Start Camera
  startBtn.addEventListener("click", () => {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 300, height: 300 } },
      qrCodeMessage => {
        const now = Date.now();
        if (now - lastScanTime > scanCooldown) {
          recordAttendance(qrCodeMessage);
          showAlert(`✅ Scanned: ${qrCodeMessage}`);
          lastScanTime = now;
        }
      }
    ).catch(err => console.error("Camera start failed:", err));
  });

  // Stop Camera
  stopBtn.addEventListener("click", () => {
    if (html5QrCode) {
      html5QrCode.stop()
        .then(() => console.log("Camera stopped"))
        .catch(err => console.error("Stop failed:", err));
    }
  });

  // Refresh List
  refreshBtn.addEventListener("click", () => {
    document.getElementById("attendance-list").innerHTML = "";
    updateStats();
  });

  // Clear List
  clearBtn.addEventListener("click", () => {
    document.getElementById("attendance-list").innerHTML = "";
    updateStats();
  });

  // Export Placeholder
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
  updateStats();
}

function updateStats() {
  const totalScanned = document.querySelectorAll("#attendance-list li").length;
  const percent = TOTAL_TEACHERS > 0 ? ((totalScanned / TOTAL_TEACHERS) * 100).toFixed(1) : 0;

  document.getElementById("total-attendees").textContent = totalScanned;
  document.getElementById("attendance-percent").textContent = `${percent}%`;
}

// --- Tab navigation ---
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
    const target = btn.getAttribute("data-target");
    document.getElementById(target).classList.add("active");
  });
});
