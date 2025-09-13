// app.js — scanner + attendance (uses server endpoints /attendance, /export, DELETE /attendance)
const TOTAL_TEACHERS = 50; // adjust to your roster size

let html5QrCode = null;
let lastScanTime = 0;
const SCAN_COOLDOWN = 3000; // ms
let cameras = [];

function showAlert(msg, ms = 2000) {
  const a = document.getElementById("page-alert");
  if (!a) return;
  a.textContent = msg;
  a.style.display = "block";
  setTimeout(() => a.style.display = "none", ms);
}

// TAB NAV
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      const target = btn.getAttribute("data-target");
      document.getElementById(target).classList.add("active");
    });
  });

  // wire up controls
  const cameraSelect = document.getElementById("camera-select");
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const refreshBtn = document.getElementById("refresh-list");
  const clearBtn = document.getElementById("clear-list");
  const exportBtn = document.getElementById("export-btn");

  // populate camera dropdown
  if (window.Html5Qrcode && Html5Qrcode.getCameras) {
    Html5Qrcode.getCameras().then(devs => {
      cameras = devs || [];
      cameraSelect.innerHTML = "";
      if (!cameras.length) {
        const opt = document.createElement("option"); opt.text = "No camera found"; opt.value = "";
        cameraSelect.appendChild(opt);
      } else {
        cameras.forEach((d, i) => {
          const opt = document.createElement("option");
          opt.value = d.id;
          opt.text = d.label || `Camera ${i+1}`;
          cameraSelect.appendChild(opt);
        });
      }
    }).catch(err => {
      console.warn("getCameras failed", err);
      const opt = document.createElement("option"); opt.text = "No camera access"; opt.value = "";
      cameraSelect.appendChild(opt);
    });
  } else {
    const opt = document.createElement("option"); opt.text = "Camera library not loaded"; opt.value = "";
    cameraSelect.appendChild(opt);
  }

  // Start camera
  startBtn.addEventListener("click", async () => {
    const selected = document.getElementById("camera-select").value;
    if (!selected) { showAlert("Please select a camera first"); return; }

    // ensure only one instance
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

    try {
      await html5QrCode.start(
        selected,
        { fps: 10, qrbox: 250 },
        (decoded) => {
          const now = Date.now();
          if (now - lastScanTime > SCAN_COOLDOWN) {
            lastScanTime = now;
            onScanned(decoded);
          }
        },
        (err) => {
          // scan failure callback (ignored)
        }
      );
      startBtn.disabled = true;
      stopBtn.disabled = false;
      showAlert("Camera started", 1200);
    } catch (e) {
      console.error("start failed", e);
      showAlert("Camera start failed — check permissions", 3000);
    }
  });

  // Stop camera
  stopBtn.addEventListener("click", async () => {
    if (!html5QrCode) { showAlert("Camera not running"); return; }
    try {
      await html5QrCode.stop();
      await html5QrCode.clear();
      html5QrCode = null;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      showAlert("Camera stopped", 1000);
    } catch (err) {
      console.warn("stop error", err);
      showAlert("Could not stop camera", 2000);
    }
  });

  // Refresh attendance
  refreshBtn.addEventListener("click", loadAttendance);

  // Clear attendance — server delete
  clearBtn.addEventListener("click", async () => {
    if (!confirm("Clear all attendance?")) return;
    try {
      await fetch("/attendance", { method: "DELETE" });
      showAlert("Attendance cleared");
      await loadAttendance();
    } catch (e) {
      console.error("clear failed", e);
      showAlert("Failed to clear");
    }
  });

  // Export
  exportBtn.addEventListener("click", () => {
    window.location.href = "/export";
  });

  // initial load
  loadAttendance();
});

// when a QR code is scanned
function onScanned(decodedText) {
  // POST to server
  fetch("/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: decodedText })
  })
    .then(r => {
      if (!r.ok) throw new Error("Server error");
      return r.json();
    })
    .then(entry => {
      showAlert(`Scanned: ${entry.name}`, 1800);
      addListEntry(entry);
      updateStatsUI();
    })
    .catch(err => {
      console.error("save scan error", err);
      showAlert("Failed to save scan", 2000);
    });
}

// load attendance from server and render
async function loadAttendance() {
  try {
    const res = await fetch("/attendance");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    const ul = document.getElementById("attendance-list");
    ul.innerHTML = "";
    data.forEach(addListEntry);
    updateStatsUI(data);
  } catch (err) {
    console.error("loadAttendance error", err);
    showAlert("Could not load attendance", 2000);
  }
}

// add single list entry (expects {name,date,time})
function addListEntry(entry) {
  const ul = document.getElementById("attendance-list");
  const li = document.createElement("li");
  li.textContent = `${entry.name} — ${entry.date} ${entry.time}`;
  ul.prepend(li); // newest on top
}

// update stats UI (count + percent)
function updateStatsUI(forceData) {
  // if forceData passed, use it; else fetch latest
  if (forceData) {
    const total = forceData.length;
    document.getElementById("total-attendees").textContent = total;
    const percent = TOTAL_TEACHERS > 0 ? ((total / TOTAL_TEACHERS) * 100).toFixed(1) : "0";
    document.getElementById("attendance-percent").textContent = `${percent}%`;
    return;
  }

  fetch("/attendance").then(r => r.json()).then(data => {
    const total = data.length;
    document.getElementById("total-attendees").textContent = total;
    const percent = TOTAL_TEACHERS > 0 ? ((total / TOTAL_TEACHERS) * 100).toFixed(1) : "0";
    document.getElementById("attendance-percent").textContent = `${percent}%`;
  }).catch(err => console.warn("updateStats error", err));
}
