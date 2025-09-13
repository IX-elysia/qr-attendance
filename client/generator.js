// generator.js — small, safe QR generator
document.addEventListener("DOMContentLoaded", () => {
  const genBtn = document.getElementById("generate-qr");
  const downBtn = document.getElementById("download-qr");
  const preview = document.getElementById("qr-preview");
  const input = document.getElementById("qr-input");
  let lastImgSrc = null;

  genBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return alert("Please enter text to generate QR");
    preview.innerHTML = ""; // clear
    // QRCode.js writes a <img> or <canvas>
    new QRCode(preview, { text, width: 220, height: 220, colorDark: "#7b0000", colorLight: "#ffffff" });
    setTimeout(() => {
      const img = preview.querySelector("img");
      if (img) {
        lastImgSrc = img.src;
        downBtn.disabled = false;
      } else {
        // sometimes QR is canvas
        const canvas = preview.querySelector("canvas");
        if (canvas) {
          lastImgSrc = canvas.toDataURL("image/png");
          downBtn.disabled = false;
        }
      }
    }, 300);
  });

  downBtn.addEventListener("click", () => {
    if (!lastImgSrc) return;
    const a = document.createElement("a");
    a.href = lastImgSrc;
    a.download = `qrcode.png`;
    a.click();
  });
});
