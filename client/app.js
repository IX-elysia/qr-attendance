// app.js — restored stable behavior + camera selection + scan cooldown + UI wiring
const TOTAL_TEACHERS = 50; // change if needed

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

document.addEventListener("DOMContentLoaded", () => {
  // Tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
      const target = btn.getAttribute("data-target");
      document.getElementById(target).classList.add("active");
    });
  });

  const cameraSelect = document.getElementById("camera-select");
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");
  const refreshBtn = document.getElementById("refresh-list");
  const clearBtn = document.getElementById("clear-list");
  const exportBtn = document.getElementById("export-btn");

  // populate cameras
  if (window.Html5Qrcode && Html5Qrcode.getCameras) {
    Html5Qrcode.getCameras()
      .then(devs => {
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
      })
      .catch(err => {
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
        (err) => { /* scan failure callback (ignored) */ }
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

  // Clear attendance
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

  // Export button
  exportBtn.addEventListener("click", () => {
    window.location.href = "/export";
  });

  // Manual input (If you still have manual input in your index, keep this)
  const addManual = document.getElementById("add-manual");
  if (addManual) {
    addManual.addEventListener("click", () => {
      const nameField = document.getElementById("manual-name");
      const name = nameField ? nameField.value.trim() : "";
      if (!name) { showAlert("Enter a name"); return; }
      // send to server
      fetch("/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      }).then(res => res.json()).then(entry => {
        addListEntry(entry);
        updateStatsUI();
        if (nameField) nameField.value = "";
        showAlert(`Added: ${entry.name}`);
      }).catch(e => { console.error(e); showAlert("Failed to add"); });
    });
  }

  // initial load
  loadAttendance();
});

// on scanned - post to server
function onScanned(decodedText) {
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
      showAlert(`Scanned: ${entry.name}`, 1600);
      addListEntry(entry);
      updateStatsUI();
    })
    .catch(err => {
      console.error("save scan error", err);
      showAlert("Failed to save scan");
    });
}

// load attendance and render list
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
    showAlert("Could not load attendance");
  }
}

// add a single list entry
function addListEntry(entry) {
  const ul = document.getElementById("attendance-list");
  const li = document.createElement("li");
  li.textContent = `${entry.name} — ${entry.date} ${entry.time}`;
  ul.prepend(li); // newest first
}

// update stats UI (optionally pass data)
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
