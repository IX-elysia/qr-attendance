let html5QrCode;
let scanning = false;
let lastScanned = null;

const toast = document.getElementById("toast");
function showToast(message) {
  toast.textContent = message;
  toast.className = "toast show";
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// Default section = Scan
document.addEventListener("DOMContentLoaded", () => {
  showSection("scan");
  loadAttendance();
});

async function loadAttendance() {
  const res = await fetch("/attendance");
  const data = await res.json();
  const list = document.getElementById("attendanceList");
  list.innerHTML = "";
  data.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} - ${entry.date} ${entry.time}`;
    list.appendChild(li);
  });
}

async function addAttendance(name) {
  const res = await fetch("/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (res.ok) {
    const data = await res.json();
    loadAttendance();
    showToast(`✅ Recorded: ${data.name}`);
  }
}

document.getElementById("manualAdd").addEventListener("click", () => {
  const name = document.getElementById("manualName").value.trim();
  if (name) addAttendance(name);
});

document.getElementById("clearBtn").addEventListener("click", async () => {
  await fetch("/attendance", { method: "DELETE" });
  loadAttendance();
  showToast("🗑️ Attendance cleared");
});

document.getElementById("refreshBtn").addEventListener("click", loadAttendance);

document.getElementById("exportBtn").addEventListener("click", () => {
  window.location.href = "/export";
});

document.getElementById("startBtn").addEventListener("click", () => {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }
  scanning = true;
  lastScanned = null;

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    decodedText => {
      if (scanning && decodedText !== lastScanned) {
        lastScanned = decodedText;
        addAttendance(decodedText);
        html5QrCode.stop().then(() => {
          scanning = false;
          showToast("📷 Scan complete, camera stopped");
        });
      }
    },
    err => console.warn(err)
  ).catch(err => console.error("Camera start failed:", err));
});

document.getElementById("stopBtn").addEventListener("click", () => {
  if (html5QrCode && scanning) {
    html5QrCode.stop().then(() => {
      scanning = false;
      showToast("⏹️ Camera stopped");
    });
  }
});

document.getElementById("generateBtn").addEventListener("click", () => {
  const text = document.getElementById("qr-input").value.trim();
  const qrDiv = document.getElementById("qrcode");
  if (!text) return alert("Enter text to generate QR");

  qrDiv.innerHTML = "";
  new QRCode(qrDiv, {
    text: text,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L
  });

  document.getElementById("downloadBtn").style.display = "inline-block";
  setTimeout(() => {
    const qrCanvas = qrDiv.querySelector("canvas");
    if (qrCanvas) {
      document.getElementById("downloadBtn").onclick = () => {
        const link = document.createElement("a");
        link.download = `${text}_qr.png`;
        link.href = qrCanvas.toDataURL("image/png");
        link.click();
      };
    }
  }, 500);
});
