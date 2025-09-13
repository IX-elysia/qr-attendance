// app.js — scanner + attendance logic
const TOTAL_TEACHERS = 50; // change to your actual roster

let html5QrCode = null;
let lastScanTime = 0;
const SCAN_COOLDOWN = 3000; // ms

function showAlert(msg, ms = 2000) {
  const a = document.getElementById("page-alert");
  if (!a) return;
  a.textContent = msg;
  a.style.display = "block";
  setTimeout(() => a.style.display = "none", ms);
}

document.addEventListener("DOMContentLoaded", () => {
  // TAB wiring
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      const target = btn.getAttribute("data-target");
      const el = document.getElementById(target);
      if (el) el.classList.add("active");
    });
  });

  const cameraSelect = document.getElementById("camera-select");
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const refreshBtn = document.getElementById("refresh-list");
  const clearBtn = document.getElementById("clear-list");
  const exportBtn = document.getElementById("export-btn");
  const addManualBtn = document.getElementById("add-manual");
  const manualName = document.getElementById("manual-name");

  // populate camera dropdown (if library is available)
  if (window.Html5Qrcode && Html5Qrcode.getCameras) {
    Html5Qrcode.getCameras().then(devices => {
      cameraSelect.innerHTML = "";
      if (!devices || devices.length === 0) {
        const opt = document.createElement("option"); opt.value = ""; opt.text = "No camera found"; cameraSelect.appendChild(opt);
      } else {
        devices.forEach((d, i) => {
          const opt = document.createElement("option");
          opt.value = d.id;
          opt.text = d.label || `Camera ${i + 1}`;
          cameraSelect.appendChild(opt);
        });
      }
    }).catch(err => {
      console.warn("getCameras error:", err);
      cameraSelect.innerHTML = "";
      const opt = document.createElement("option"); opt.value = ""; opt.text = "Camera access denied / unavailable"; cameraSelect.appendChild(opt);
    });
  } else {
    cameraSelect.innerHTML = "";
    const opt = document.createElement("option"); opt.value = ""; opt.text = "Camera library not loaded"; cameraSelect.appendChild(opt);
  }

  // Start camera
  startBtn.addEventListener("click", async () => {
    const sel = cameraSelect.value;
    if (!sel) { showAlert("Please select a camera first"); return; }

    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    try {
      await html5QrCode.start(
        sel,
        { fps: 10, qrbox: 250 },
        decodedText => {
          const now = Date.now();
          if (now - lastScanTime > SCAN_COOLDOWN) {
            lastScanTime = now;
            onScanned(decodedText);
          }
        },
        errorMsg => {
          // ignore scan failure messages
        }
      );
      startBtn.disabled = true;
      stopBtn.disabled = false;
      showAlert("Camera started", 1200);
    } catch (e) {
      console.error("camera start failed", e);
      showAlert("Camera start failed — check permissions", 2500);
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
      console.warn("stop failed", err);
      showAlert("Could not stop camera", 2000);
    }
  });

  // Manual add
  if (addManualBtn) {
    addManualBtn.addEventListener("click", async () => {
      const name = manualName.value.trim();
      if (!name) { showAlert("Enter a name"); return; }
      try {
        const res = await fetch("/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });
        const entry = await res.json();
        addListEntry(entry);
        updateStatsUI();
        manualName.value = "";
        showAlert(`Added: ${entry.name}`);
      } catch (e) {
        console.error("manual add error", e);
        showAlert("Failed to add");
      }
    });
  }

  // Refresh
  if (refreshBtn) refreshBtn.addEventListener("click", loadAttendance);

  // Clear
  if (clearBtn) clearBtn.addEventListener("click", async () => {
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
  if (exportBtn) exportBtn.addEventListener("click", () => {
    window.location.href = "/export";
  });

  // initial load
  loadAttendance();
});

// called when QR is scanned (debounced)
async function onScanned(decodedText) {
  try {
    const res = await fetch("/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: decodedText })
    });
    if (!res.ok) throw new Error("Server error");
    const entry = await res.json();
    addListEntry(entry);
    updateStatsUI();
    showAlert(`Scanned: ${entry.name}`, 1500);
  } catch (err) {
    console.error("save scan error", err);
    showAlert("Failed to save scan");
  }
}

// load attendance from server
async function loadAttendance() {
  try {
    const res = await fetch("/attendance");
    if (!res.ok) throw new Error("Failed to fetch attendance");
    const data = await res.json();
    const ul = document.getElementById("attendance-list");
    ul.innerHTML = "";
    data.forEach(addListEntry);
    updateStatsUI(data);
  } catch (e) {
    console.error("loadAttendance error", e);
    showAlert("Could not load attendance");
  }
}

function addListEntry(entry) {
  const ul = document.getElementById("attendance-list");
  const li = document.createElement("li");
  li.textContent = `${entry.name} — ${entry.date} ${entry.time}`;
  ul.prepend(li); // newest on top
}

function updateStatsUI(forceData) {
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
