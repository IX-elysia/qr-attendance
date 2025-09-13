let html5QrCode;
let isScanning = false;
let selectedCameraId = null;

const startBtn = document.getElementById("start-camera");
const stopBtn = document.getElementById("stop-camera");
const cameraSelect = document.getElementById("camera-select");

async function loadCameras() {
  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length) {
      cameraSelect.innerHTML = "";
      devices.forEach((cam, idx) => {
        const option = document.createElement("option");
        option.value = cam.id;
        option.text = cam.label || `Camera ${idx + 1}`;
        cameraSelect.appendChild(option);
      });
      selectedCameraId = devices[0].id;
      cameraSelect.value = selectedCameraId;
    } else {
      alert("No cameras found.");
    }
  } catch (err) {
    console.error("Error loading cameras:", err);
  }
}

async function startCamera() {
  if (isScanning) return;
  if (!selectedCameraId) {
    alert("Please select a camera first.");
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

  try {
    await html5QrCode.start(
      { deviceId: { exact: selectedCameraId } },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        console.log("Scanned:", decodedText);

        await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: decodedText }),
        });

        alert("✅ Scanned: " + decodedText);
      }
    );
    isScanning = true;
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not start selected camera.");
  }
}

async function stopCamera() {
  if (html5QrCode && isScanning) {
    await html5QrCode.stop();
    html5QrCode.clear();
    isScanning = false;
  }
}

cameraSelect.addEventListener("change", (e) => {
  selectedCameraId = e.target.value;
});

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);

// Load cameras on page load
loadCameras();
