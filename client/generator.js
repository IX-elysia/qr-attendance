document.getElementById("generate-btn").addEventListener("click", async () => {
  const text = document.getElementById("qr-text").value;
  if (!text) return alert("Please enter text!");

  const canvas = document.getElementById("qr-canvas");
  await QRCode.toCanvas(canvas, text, { width: 250 });

  const link = document.getElementById("download-link");
  link.href = canvas.toDataURL("image/png");
  link.style.display = "inline-block";
});
