let html5QrCode;
let isCameraRunning = false;

// Show selected tab
function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  if (tabId === "attendance") {
    fetchAttendance();
  }
}

// Start/Stop camera
document.getElementById("start-camera").addEventListener("click", () => {
  if (!isCameraRunning) {
    startScanner();
  } else {
    stopScanner();
  }
});

function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => {
      recordAttendance(qrCodeMessage);
      stopScanner();
    }
  ).then(() => {
    isCameraRunning = true;
    document.getElementById("start-camera").innerText = "Stop Camera";
  }).catch(err => {
    console.error("Camera start failed:", err);
  });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      isCameraRunning = false;
      document.getElementById("start-camera").innerText = "Start Camera";
    });
  }
}

// Record attendance (QR + Manual)
function recordAttendance(name) {
  fetch("/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  })
  .then(res => res.json())
  .then(data => {
    const resultBox = document.getElementById("scan-result");
    resultBox.textContent = `✅ ${data.name} recorded at ${data.date} ${data.time}`;
    fetchAttendance();
  });
}

// Manual input
function addManual() {
  const input = document.getElementById("manual-name");
  const name = input.value.trim();
  if (name) {
    recordAttendance(name);
    input.value = "";
  }
}

// Fetch attendance
function fetchAttendance() {
  fetch("/attendance")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("attendance-list");
      list.innerHTML = "";
      if (data.length === 0) {
        list.innerHTML = "<li style='color: #aaa;'>No attendance recorded yet</li>";
      } else {
        data.forEach(entry => {
          const li = document.createElement("li");
          li.textContent = `${entry.name} – ${entry.date} ${entry.time}`;
          list.appendChild(li);
        });
      }
    });
}

// Clear attendance
function clearAttendance() {
  fetch("/attendance", { method: "DELETE" })
    .then(() => fetchAttendance());
}

// Export Excel
function exportExcel() {
  window.location.href = "/export";
}

// Default tab
showTab("scan");
