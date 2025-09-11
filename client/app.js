function showSection(id) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-camera");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          alert("QR Code detected: " + decodedText);
        },
        (err) => {
          console.warn(err);
        }
      ).catch(err => console.error("Camera start failed:", err));
    });
  }
});
