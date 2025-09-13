let qrCode = null;
const generateBtn = document.getElementById("generate-btn");
const downloadBtn = document.getElementById("download-btn");
const historyEl = document.getElementById("history");
const previewEl = document.getElementById("qr-preview");

generateBtn.addEventListener("click", () => {
  const name = document.getElementById("teacher-name").value.trim();
  if (!name) {
    alert("Please enter a name!");
    return;
  }

  // Clear old QR
  previewEl.innerHTML = "";

  // Generate QR
  qrCode = new QRCode(previewEl, {
    text: name,
    width: 200,
    height: 200,
    colorDark: "#800000",
    colorLight: "#ffffff",
  });

  // Enable download
  setTimeout(() => {
    downloadBtn.disabled = false;

    // Save in history
    addToHistory(name, previewEl.querySelector("img").src);
  }, 500);
});

// Download QR
downloadBtn.addEventListener("click", () => {
  if (!qrCode) return;
  const img = previewEl.querySelector("img");
  const link = document.createElement("a");
  link.href = img.src;
  link.download = "qghs_qr.png";
  link.click();
});

// Add to history
function addToHistory(name, src) {
  const item = document.createElement("div");
  item.classList.add("history-item");
  item.innerHTML = `
    <img src="${src}" alt="QR for ${name}">
    <p>${name}</p>
  `;
  historyEl.prepend(item);

  // Keep last 5
  if (historyEl.children.length > 5) {
    historyEl.removeChild(historyEl.lastChild);
  }
}
