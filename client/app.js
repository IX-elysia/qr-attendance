window.onload = function () {
  console.log("[app] loaded");
  const startBtn = document.getElementById("startCamera");
  const stopBtn  = document.getElementById("stopCamera");
  const statusEl = document.getElementById("scanStatus");
  const qrReader = document.getElementById("qr-reader");
  const manualInput = document.getElementById("manualName");
  const addManualBtn = document.getElementById("addManual");
  const refreshBtn = document.getElementById("refreshBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const attendanceList = document.getElementById("attendanceList");
  const attendanceSummary = document.getElementById("attendanceSummary");

  // state
  let qrScanner = null;
  let isScanning = false;
  let preferredCameraId = null;

  // helper: print status
  function setStatus(text, isError = false) {
    statusEl.textContent = "Status: " + text;
    statusEl.style.color = isError ? "crimson" : "#2d7f2d";
    console.log("[status]", text);
  }

  // check environment (secure origin)
  function checkSecure() {
    if (location.protocol === "https:" || location.hostname === "localhost") return true;
    setStatus("Camera requires HTTPS (or run on localhost).", true);
    return false;
  }

  // find camera list + choose preferred (back) camera if available
  async function chooseCamera() {
    if (typeof Html5Qrcode === "undefined") {
      setStatus("QR library not loaded.", true);
      return null;
    }
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setStatus("No camera devices found.", true);
        return null;
      }
      // prefer 'back' or 'rear' camera if label present (mobile)
      const back = devices.find(d => /back|rear|environment/i.test(d.label));
      preferredCameraId = (back && back.id) || devices[0].id;
      console.log("[cameras]", devices, "preferred:", preferredCameraId);
      return preferredCameraId;
    } catch (err) {
      console.error("getCameras() failed:", err);
      setStatus("Could not enumerate cameras: " + (err.message || err), true);
      return null;
    }
  }

  // start scanning
  startBtn.addEventListener("click", async () => {
    console.log("Start clicked");
    if (!checkSecure()) return;
    if (isScanning) { setStatus("Already scanning"); return; }

    const camId = await chooseCamera();
    if (!camId) return;

    // ensure previous instance cleaned
    if (!qrScanner) {
      qrScanner = new Html5Qrcode("qr-reader", { verbose: false });
    }

    // build qrbox based on container size (keeps it responsive)
    const boxSize = Math.min(300, Math.floor(qrReader.clientWidth * 0.9));

    try {
      await qrScanner.start(
        camId,
        { fps: 10, qrbox: { width: boxSize, height: boxSize } },
        decodedText => {
          // success callback
          console.log("QR scanned:", decodedText);
          setStatus("Scanned: " + decodedText);
          // Record attendance (POST to server) and stop scanning briefly to prevent duplicates
          recordAttendance(decodedText).catch(e => console.error(e));
          // optional: stop after one scan to avoid duplicates - comment out if you want continuous scanning
          stopScanning();
        },
        errorMessage => {
          // scan failure callback (ignored normally)
        }
      );
      isScanning = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      setStatus("Scanning...");
    } catch (err) {
      console.error("start() error", err);
      if (err && err.name === "NotAllowedError") {
        setStatus("Camera permission denied. Allow camera in browser.", true);
      } else {
        setStatus("Camera start failed: " + (err.message || err), true);
      }
      try { qrScanner.clear(); } catch(e) {}
      qrScanner = null;
    }
  });

  // stop scanning
  async function stopScanning() {
    if (!qrScanner || !isScanning) {
      setStatus("Camera not running");
      return;
    }
    try {
      await qrScanner.stop();
      await qrScanner.clear();
    } catch (err) {
      console.warn("stop() error", err);
    } finally {
      isScanning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      setStatus("Camera stopped");
    }
  }
  stopBtn.addEventListener("click", stopScanning);

  // record attendance (calls backend)
  async function recordAttendance(name) {
    try {
      const res = await fetch("/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Server error " + res.status);
      const data = await res.json();
      // refresh list (server returns saved entry)
      await loadAttendance();
      // show server-confirmed message (server should supply date/time)
      if (data && data.name && data.time) {
        setStatus(`${data.name} recorded at ${data.date} ${data.time}`);
      } else {
        setStatus(`Recorded: ${name}`);
      }
    } catch (err) {
      console.error("recordAttendance failed:", err);
      setStatus("Failed to record attendance (network).", true);
    }
  }

  // manual add
  addManualBtn.addEventListener("click", () => {
    const name = manualInput.value.trim();
    if (!name) { setStatus("Enter a name to add", true); return; }
    recordAttendance(name);
    manualInput.value = "";
  });

  // load attendance from server and render
  async function loadAttendance() {
    try {
      const res = await fetch("/attendance");
      if (!res.ok) { setStatus("Failed to load attendance", true); return; }
      const data = await res.json();
      const list = attendanceList;
      list.innerHTML = "";
      if (!data || data.length === 0) {
        attendanceSummary.textContent = "No attendance records yet.";
        return;
      }
      // server returns array of {name, date, time} or similar
      // support both array and object shapes:
      if (Array.isArray(data)) {
        data.forEach(entry => {
          const li = document.createElement("li");
          if (typeof entry === "object") li.textContent = `${entry.name} — ${entry.date} ${entry.time}`;
          else li.textContent = entry;
          list.appendChild(li);
        });
        attendanceSummary.textContent = `Total attendees: ${data.length}`;
      } else if (typeof data === "object") {
        // object keyed by name (older versions)
        const keys = Object.keys(data);
        keys.forEach(k => {
          const li = document.createElement("li");
          const v = data[k];
          if (v && v.time) li.textContent = `${k} — ${v.time}`;
          else li.textContent = `${k}`;
          list.appendChild(li);
        });
        attendanceSummary.textContent = `Total attendees: ${keys.length}`;
      } else {
        attendanceSummary.textContent = "No attendance records.";
      }
    } catch (err) {
      console.error("loadAttendance error:", err);
      attendanceSummary.textContent = "Could not load attendance.";
    }
  }

  refreshBtn.addEventListener("click", loadAttendance);

  // clear attendance
  clearBtn.addEventListener("click", async () => {
    if (!confirm("Clear all attendance records?")) return;
    try {
      // server route name may be /attendance DELETE or /clear POST depending on your server
      // Try DELETE on /attendance first (common), fallback to POST /clear
      let ok = false;
      let r = await fetch("/attendance", { method: "DELETE" });
      if (r.ok) ok = true;
      else {
        r = await fetch("/clear", { method: "POST" });
        ok = r.ok;
      }
      if (!ok) throw new Error("Server did not clear");
      setStatus("Attendance cleared");
      await loadAttendance();
    } catch (err) {
      console.error("clear error:", err);
      setStatus("Failed to clear attendance.", true);
    }
  });

  // export
  exportBtn.addEventListener("click", () => {
    // navigate to server export route
    window.location.href = "/export";
  });

  // initial load
  loadAttendance();
};
