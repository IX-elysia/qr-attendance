document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  const tabs = document.querySelectorAll(".tablink");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      contents.forEach(c => c.classList.remove("active"));
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");

      // stop scanner if leaving scan tab
      if (btn.getAttribute("data-tab") !== "scan") {
        stopScanner();
        startBtn.textContent = "🎥 Start Camera";
      }
    });
  });

  // Attendance list
  const attendanceList = document.getElementById("attendance-list");

  async function loadAttendance() {
    const res = await fetch("/attendance");
    const data = await res.json();
    attendanceList.innerHTML = "";
    data.forEach(name => {
      const li = document.createElement("li");
      li.textContent = name;
      attendanceList.appendChild(li);
    });
  }
  loadAttendance();

  // QR Scanner
  const statusEl = document.getElementById("scan-status");
  const qrRegion = document.getElementById("qr-reader");
  const startBtn = document.getElementById("start-scan");
  let html5QrCode = null;

  function showStatus(msg) {
    statusEl.textContent = msg;
  }

  function startScanner() {
    if (html5QrCode) return;
    html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: 250 };

    html5QrCode.start({ facingMode: "environment" }, config,
      qrCodeMessage => { handleQrPayload(qrCodeMessage); },
      errorMessage => {}
    ).then(() => {
      showStatus("✅ Camera ready — scan a QR code.");
    }).catch(err => {
      showStatus("⚠️ Camera failed: " + err);
      stopScanner();
      startBtn.textContent = "🎥 Start Camera";
    });
  }

  function stopScanner() {
    if (!html5QrCode) return;
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
      qrRegion.innerHTML = "";
    }).catch(()=>{});
  }

  startBtn.addEventListener("click", () => {
    if (!html5QrCode) {
      startScanner();
      startBtn.textContent = "🛑 Stop Camera";
    } else {
      stopScanner();
      startBtn.textContent = "🎥 Start Camera";
      showStatus("Camera stopped.");
    }
  });

  async function handleQrPayload(name) {
    showStatus(`Scanned: ${name}`);
    await fetch("/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    loadAttendance();
  }

  // Export to Excel
  document.getElementById("export-btn").addEventListener("click", async () => {
    const res = await fetch("/export");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.xlsx";
    a.click();
  });
});
