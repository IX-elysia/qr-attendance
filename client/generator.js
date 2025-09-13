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
    QRCode.toCanvas(preview, text, { width: 220, margin: 1 }, (err, canvas) => {
      if (err) return console.error(err);
      lastImgSrc = canvas.toDataURL("image/png");
      downBtn.disabled = false;
      // history
      const history = document.getElementById("history");
      const item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML = `<img src="${lastImgSrc}" alt="${text}"><p>${text}</p>`;
      history.prepend(item);
      if (history.children.length > 6) history.removeChild(history.lastChild);
    });
  });

  downBtn.addEventListener("click", () => {
    if (!lastImgSrc) return;
    const a = document.createElement("a");
    a.href = lastImgSrc;
    a.download = "qrcode.png";
    a.click();
  });
});
