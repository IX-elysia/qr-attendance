let html5QrCode;
let lastScanTime = 0;
const scanCooldown = 3000; // 3s cooldown

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");

  startBtn.addEventListener("click", async () => {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      const cameraId = devices.length > 1 ? devices[1].id : devices[0].id;

      await html5QrCode.start(
        { deviceId: { exact: cameraId } },
        { fps: 10, qrbox: 250 },
        async decodedText => {
          const now = Date.now();
          if (now - lastScanTime > scanCooldown) {
            await fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: decodedText }),
            });
            alert(`✅ Scanned: ${decodedText}`);
            lastScanTime = now;
          }
        }
      );
    } catch (err) {
      console.error("Camera start failed:", err);
      alert("❌ Unable to start camera");
    }
  });

  stopBtn.addEventListener("click", async () => {
    if (html5QrCode) {
      await html5QrCode.stop();
    }
  });
});
