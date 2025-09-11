document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------
     Scanner variables & helpers
     ------------------------- */
  const statusEl = document.getElementById('scan-status');
  const qrRegion = document.getElementById('qr-reader');
  const startBtn = document.getElementById('start-scan');
  let html5QrCode = null;

  function showStatus(msg){ statusEl.textContent = msg; }

  function startScanner(){
    if (html5QrCode) return; // already running
    html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: 250 };

    html5QrCode.start({ facingMode: "environment" }, config,
      qrCodeMessage => { handleQrPayload(qrCodeMessage); },
      errorMessage => {}
    ).then(() => {
      showStatus("✅ Camera ready — scan a QR code.");
    }).catch(err => {
      showStatus('⚠️ Camera start failed — please allow permission. ' + err);
      stopScanner();
      startBtn.textContent = "🎥 Start Camera";
    });
  }

  function stopScanner(){
    if (!html5QrCode) return;
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
      qrRegion.innerHTML = '';
    }).catch(()=>{});
  }

  /* Toggle button */
  startBtn.addEventListener('click', () => {
    if (!html5QrCode) {
      startScanner();
      startBtn.textContent = "🛑 Stop Camera";
    } else {
      stopScanner();
      startBtn.textContent = "🎥 Start Camera";
      showStatus("Camera stopped.");
    }
  });

  /* Stop camera when leaving Scan tab */
  document.querySelectorAll(".tablink").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("data-tab") !== "scan") {
        stopScanner();
        startBtn.textContent = "🎥 Start Camera";
      }
    });
  });
});
