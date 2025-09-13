// generator.js
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("qr-text");
  const genBtn = document.getElementById("generate-btn");
  const downBtn = document.getElementById("download-btn");
  const preview = document.getElementById("qr-code");
  const history = document.getElementById("history");
  let lastDataUrl = null;

  genBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) { alert("Please enter a name or text"); return; }

    preview.innerHTML = ""; // clear previous
    // new QRCode (qrcodejs)
    new QRCode(preview, {
      text: text,
      width: 220,
      height: 220,
      colorDark: "#7b0000",
      colorLight: "#ffffff"
    });

    // after a short delay get the generated img/canvas
    setTimeout(() => {
      const img = preview.querySelector("img");
      const canvas = preview.querySelector("canvas");
      if (img) {
        lastDataUrl = img.src;
      } else if (canvas) {
        lastDataUrl = canvas.toDataURL("image/png");
      } else {
        lastDataUrl = null;
      }

      if (lastDataUrl) {
        downBtn.disabled = false;
        // add to history
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `<img src="${lastDataUrl}" alt="${text}"><p>${text}</p>`;
        history.prepend(item);
        if (history.children.length > 6) history.removeChild(history.lastChild);
      }
    }, 250);
  });

  downBtn.addEventListener("click", () => {
    if (!lastDataUrl) return;
    const a = document.createElement("a");
    a.href = lastDataUrl;
    a.download = `qrcode.png`;
    a.click();
  });
});
