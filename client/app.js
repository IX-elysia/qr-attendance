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

// Start camera button
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
      fetch("/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: qrCodeMessage })
      });
      alert("Scanned: " + qrCodeMessage);
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

// Fetch attendance list
function fetchAttendance() {
  fetch("/attendance")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("attendance-list");
      list.innerHTML = "";
      data.forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        list.appendChild(li);
      });
    });
}

// Export to Excel
function exportExcel() {
  window.location.href = "/export";
}

// Default tab
showTab("scan");
