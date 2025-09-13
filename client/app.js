let html5QrCode;
let isScanning = false;

const startBtn = document.getElementById("start-camera");
const stopBtn = document.getElementById("stop-camera");

async function startCamera() {
  if (isScanning) return;

  html5QrCode = new Html5Qrcode("reader");

  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length) {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          console.log("Scanned:", decodedText);

          // Send to backend
          await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: decodedText }),
          });

          alert("✅ Scanned: " + decodedText);
        }
      );
      isScanning = true;
    } else {
      alert("No cameras found.");
    }
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not start camera.");
  }
}

async function stopCamera() {
  if (html5QrCode && isScanning) {
    await html5QrCode.stop();
    html5QrCode.clear();
    isScanning = false;
  }
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
