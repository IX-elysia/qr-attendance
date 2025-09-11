/* frontend logic: tabs, camera, manual add, attendance list, export */
document.addEventListener("DOMContentLoaded", () => {
  // --- elements ---
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const readerEl = document.getElementById("reader");
  const startBtn = document.getElementById("start-camera");
  const resultBox = document.getElementById("scan-result");
  const manualInput = document.getElementById("manual-name");
  const manualAdd = document.getElementById("manual-add");
  const attendanceListEl = document.getElementById("attendance-list");
  const refreshBtn = document.getElementById("refresh-list");
  const clearBtn = document.getElementById("clear-attendance");
  const exportBtn = document.getElementById("export-excel");

  // state
  let html5QrCode = null;
  let isCameraRunning = false;

  // --- tab switching ---
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      // set active tab button
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // show right panel
      tabContents.forEach(c => c.classList.remove("active"));
      document.getElementById(target).classList.add("active");
      // if leaving scan tab, stop camera
      if (target !== "scan" && isCameraRunning) {
        stopScanner();
      }
      // auto-refresh attendance when opening attendance tab
      if (target === "attendance") refreshList();
    });
  });

  // set reader placeholder (when no camera active)
  function setReaderPlaceholder() {
    readerEl.innerHTML = '<div class="placeholder">📷 Camera preview will appear here</div>';
  }
  setReaderPlaceholder();

  // --- camera functions ---
  function startScanner() {
    if (isCameraRunning) return;
    // clear placeholder before attaching camera
    readerEl.innerHTML = "";
    html5QrCode = new Html5QrCode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText, decodedResult) => {
        // on success
        recordAttendance(decodedText);
        // stop after one scan to avoid duplicates
        stopScanner();
      },
      (error) => {
        // scan failure callback (ignored)
      }
    ).then(() => {
      isCameraRunning = true;
      startBtn.innerText = "Stop Camera";
      resultBox.textContent = "";
    }).catch(err => {
      console.error("Camera start failed:", err);
      resultBox.textContent = "⚠️ Camera permission or device issue.";
      setReaderPlaceholder();
    });
  }

  function stopScanner() {
    if (!html5QrCode || !isCameraRunning) {
      isCameraRunning = false;
      startBtn.innerText = "Start Camera";
      setReaderPlaceholder();
      return;
    }
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
      isCameraRunning = false;
      startBtn.innerText = "Start Camera";
      setReaderPlaceholder();
    }).catch(err => {
      console.warn("Error stopping scanner:", err);
      // reset anyway
      html5QrCode = null;
      isCameraRunning = false;
      startBtn.innerText = "Start Camera";
      setReaderPlaceholder();
    });
  }

  // toggle camera on button
  startBtn.addEventListener("click", () => {
    if (!isCameraRunning) startScanner();
    else stopScanner();
  });

  // --- attendance / server interactions ---
  // POST a name to server, show server response (server gives date/time)
  function recordAttendance(name) {
    if (!name || !name.trim()) return;
    fetch("/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    })
    .then(r => r.json())
    .then(data => {
      // show server-confirmed text
      resultBox.textContent = `✅ ${data.name} recorded at ${data.date} ${data.time}`;
      refreshList(); // update UI immediately
    })
    .catch(err => {
      console.error("Record failed:", err);
      resultBox.textContent = "⚠️ Could not record attendance (network).";
    });
  }

  // manual add button
  manualAdd.addEventListener("click", () => {
    const val = manualInput.value.trim();
    if (!val) return;
    recordAttendance(val);
    manualInput.value = "";
  });

  // fetch attendance list and render
  function refreshList() {
    fetch("/attendance")
      .then(r => r.json())
      .then(data => {
        attendanceListEl.innerHTML = "";
        if (!data || data.length === 0) {
          const li = document.createElement("li");
          li.className = "empty";
          li.textContent = "No attendance recorded yet";
          attendanceListEl.appendChild(li);
          return;
        }
        data.forEach(entry => {
          const li = document.createElement("li");
          li.textContent = `${entry.name} — ${entry.date} ${entry.time}`;
          attendanceListEl.appendChild(li);
        });
      })
      .catch(err => {
        console.error("Fetch attendance failed:", err);
        attendanceListEl.innerHTML = "<li class='empty'>Could not load attendance</li>";
      });
  }

  // clear attendance
  clearBtn.addEventListener("click", () => {
    if (!confirm("Clear all attendance records?")) return;
    fetch("/attendance", { method: "DELETE" })
      .then(() => {
        refreshList();
        resultBox.textContent = "🗑️ Attendance cleared";
      })
      .catch(err => {
        console.error("Clear failed:", err);
        resultBox.textContent = "⚠️ Could not clear attendance";
      });
  });

  // refresh button
  refreshBtn.addEventListener("click", refreshList);

  // export button
  exportBtn.addEventListener("click", () => {
    // navigate to backend export route (server serves the file)
    window.location.href = "/export";
  });

  // load initial attendance (so Attendance tab has up-to-date data)
  refreshList();

  // stop camera when window/tab is hidden (optional safety)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isCameraRunning) {
      stopScanner();
    }
  });
});
