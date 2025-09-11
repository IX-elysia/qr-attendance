/* client/app.js
   - tabs, scanner (stops after first scan), toast, generator with download
   - uses server endpoints: POST /attendance, GET /attendance, DELETE /attendance, GET /export
*/

(() => {
  // elements
  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const tabs = {
    scan: document.getElementById("scan"),
    attendance: document.getElementById("attendance"),
    generator: document.getElementById("generator")
  };

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const manualAdd = document.getElementById("manualAdd");
  const manualName = document.getElementById("manualName");

  const refreshBtn = document.getElementById("refreshBtn");
  const clearBtn = document.getElementById("clearBtn");
  const exportBtn = document.getElementById("exportBtn");
  const attendanceList = document.getElementById("attendanceList");
  const countEl = document.getElementById("count");

  const generateBtn = document.getElementById("generateBtn");
  const qrInput = document.getElementById("qr-input");
  const qrcodeDiv = document.getElementById("qrcode");
  const downloadBtn = document.getElementById("downloadBtn");

  const toastEl = document.getElementById("toast");

  // state
  let html5QrCode = null;
  let scanLocked = false; // prevents repeated scans

  // helper: show toast
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3000);
  }

  // TAB system
  function activateTab(name) {
    // highlight button
    tabButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    // show section, hide others
    Object.keys(tabs).forEach(k => {
      tabs[k].classList.toggle("visible", k === name);
      tabs[k].classList.toggle("hidden", k !== name);
    });
    // when opening attendance, refresh
    if (name === "attendance") loadAttendance();
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  // default
  document.addEventListener("DOMContentLoaded", () => {
    activateTab("scan");
    loadAttendance();
  });

  /* ------------- Attendance server calls ------------- */
  async function loadAttendance() {
    try {
      const res = await fetch("/attendance");
      const data = await res.json();
      attendanceList.innerHTML = "";
      data.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.name} — ${entry.date} ${entry.time}`;
        attendanceList.appendChild(li);
      });
      countEl.textContent = `Total: ${data.length}`;
    } catch (err) {
      console.error("Load attendance failed", err);
    }
  }

  async function postAttendance(name) {
    try {
      const res = await fetch("/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      showToast(`✅ Recorded: ${data.name}`);
      loadAttendance();
      return data;
    } catch (err) {
      console.error("Post attendance failed", err);
      showToast("⚠️ Could not record");
    }
  }

  async function clearAttendance() {
    try {
      await fetch("/attendance", { method: "DELETE" });
      loadAttendance();
      showToast("🗑️ Attendance cleared");
    } catch (err) {
      console.error("Clear failed", err);
    }
  }

  /* ------------- Scanner control ------------- */
  function ensureScannerInstance() {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("qr-reader");
  }

  startBtn.addEventListener("click", async () => {
    if (scanLocked) {
      // if previously locked, allow restart by resetting lock
      scanLocked = false;
    }
    ensureScannerInstance();

    showToast("📷 Starting camera...");
    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async decodedText => {
          if (scanLocked) return;
          scanLocked = true; // prevent duplicates
          // record to server and stop scanner
          await postAttendance(decodedText);
          try {
            await html5QrCode.stop();
            html5QrCode.clear();
            html5QrCode = null;
          } catch (e) { /* ignore */ }
          showToast("📷 Scan complete — camera stopped");
        },
        error => {
          // scanning failures (ignored)
        }
      );
    } catch (err) {
      console.error("Camera failed to start:", err);
      showToast("⚠️ Camera start failed");
    }
  });

  stopBtn.addEventListener("click", async () => {
    if (!html5QrCode) { showToast("⏹️ Camera already stopped"); return; }
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
      html5QrCode = null;
      scanLocked = false;
      showToast("⏹️ Camera stopped");
    } catch (err) {
      console.error("Stop error", err);
      showToast("⚠️ Could not stop camera");
    }
  });

  /* ------------- Manual add, refresh, clear, export ------------- */
  manualAdd.addEventListener("click", () => {
    const name = manualName.value.trim();
    if (!name) return showToast("Enter a name");
    postAttendance(name);
    manualName.value = "";
  });

  refreshBtn.addEventListener("click", loadAttendance);
  clearBtn.addEventListener("click", clearAttendance);
  exportBtn.addEventListener("click", () => {
    // server serves .xlsx at /export
    window.location.href = "/export";
  });

  /* ------------- QR Generator ------------- */
  generateBtn.addEventListener("click", () => {
    const text = qrInput.value.trim();
    if (!text) return showToast("Enter text to generate QR");
    qrcodeDiv.innerHTML = ""; // remove old
    // simple, low-noise QR
    new QRCode(qrcodeDiv, {
      text,
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L
    });
    // show download button and attach
    setTimeout(() => {
      const canvas = qrcodeDiv.querySelector("canvas");
      if (!canvas) return;
      downloadBtn.style.display = "inline-block";
      downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.download = `${text}_qr.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
    }, 300);
  });

})();
