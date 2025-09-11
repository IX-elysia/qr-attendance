// app.js — UI, scanner, attendance API and QR generator

/* -------------------------
   Tabs & panel switching
   ------------------------- */
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  const name = t.dataset.tab;
  panels.forEach(p => p.classList.toggle('active', p.id === name));

  // Only stop scanner when leaving Scan tab
  if (name !== "scan") stopScanner();
}));

/* -------------------------
   Scanner variables & helpers
   ------------------------- */
const statusEl = document.getElementById('scan-status');
const qrRegion = document.getElementById('qr-reader');
let html5QrCode = null;
function showStatus(msg){ statusEl.textContent = msg; }

/* Start scanner (user must click Start Camera to trigger) */
function startScanner(){
  if (html5QrCode) return; // already running
  html5QrCode = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: 250 };

  html5QrCode.start({ facingMode: "environment" }, config,
    qrCodeMessage => { handleQrPayload(qrCodeMessage); },
    errorMessage => {}
  ).then(() => {
    showStatus("Camera ready — scan a QR code.");
  }).catch(err => {
    showStatus('Camera start failed — please allow permission. ' + err);
  });
}

/* Stop and clear the scanner */
function stopScanner(){
  if (!html5QrCode) return;
  html5QrCode.stop().then(() => {
    html5QrCode.clear();
    html5QrCode = null;
    qrRegion.innerHTML = '';
  }).catch(()=>{});
}

/* When a QR is scanned, parse payload and POST to server */
function handleQrPayload(payload){
  let data = { name: payload };
  try {
    const parsed = JSON.parse(payload);
    if (parsed && (parsed.name || parsed.id)) data = parsed;
  } catch(e) {}

  fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: data.name, id: data.id })
  }).then(r => r.json()).then(j => {
    if (j.ok) {
      showStatus(`✅ Recorded: ${data.name} — ${new Date().toLocaleString()}`);
      refreshList();
    } else {
      showStatus('❌ Failed to record: ' + (j.error || JSON.stringify(j)));
    }
  }).catch(err => showStatus('❌ Network error: '+err));
}

/* -------------------------
   Wire up scanner controls
   ------------------------- */
document.getElementById('start-scan').addEventListener('click', () => {
  startScanner();
});

/* Manual submit (for testing without QR) */
document.getElementById('manual-submit').addEventListener('click', ()=>{
  const n = document.getElementById('manual-name').value.trim();
  if (!n) return showStatus('Enter a name');
  handleQrPayload(n);
});

/* -------------------------
   Attendance list + export
   ------------------------- */
async function refreshList(){
  const listEl = document.getElementById('list');
  listEl.innerHTML = 'Loading...';
  try {
    const res = await fetch('/api/attendance');
    const arr = await res.json();
    if (!arr.length) listEl.innerHTML = '<div class="item">No records yet</div>';
    else listEl.innerHTML = arr.slice().reverse().map(r => `
      <div class="item"><div>
        <strong>${escapeHtml(r.name)}</strong>
        <div class="muted">ID: ${escapeHtml(r.id||'—')}</div>
      </div><div style="text-align:right"><div class="muted">${new Date(r.timestamp).toLocaleString()}</div></div></div>
    `).join('');
  }catch(e){ listEl.innerHTML = 'Could not load'; }
}
function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>\"']/g, c=> ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' })[c]);
}
document.getElementById('refresh-list').addEventListener('click', refreshList);
document.getElementById('clear-local').addEventListener('click', ()=>{ document.getElementById('list').innerHTML = ''; });
document.getElementById('export-btn').addEventListener('click', ()=>{ window.location.href = '/api/export'; });

/* Initialize attendance list on load */
window.addEventListener('load', ()=> refreshList());

/* -------------------------
   QR GENERATOR
   ------------------------- */
const qrNameInput = document.getElementById('qr-name');
const qrIdInput = document.getElementById('qr-id');
const generateBtn = document.getElementById('generate-btn');
const qrBox = document.getElementById('qrcode');
const qrDownload = document.getElementById('download-qr');
let qrInstance = null;

generateBtn.addEventListener('click', () => {
  const name = qrNameInput.value.trim();
  const id = qrIdInput.value.trim();
  if (!name) {
    alert('Please enter a name (required)');
    qrNameInput.focus();
    return;
  }

  // Payload: JSON if ID provided, otherwise plain name string
  const payload = id ? JSON.stringify({ name, id }) : name;

  // Clear previous QR and create a new one
  qrBox.innerHTML = '';
  qrInstance = new QRCode(qrBox, {
    text: payload,
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff"
  });

  // Wait a tiny bit for the QR library to render (img or canvas)
  setTimeout(() => {
    // Prefer <img> if present
    const img = qrBox.querySelector('img');
    if (img && img.src) {
      qrDownload.href = img.src;
      qrDownload.style.display = 'inline-block';
      qrDownload.textContent = '⬇️ Download QR';
    } else {
      const canvas = qrBox.querySelector('canvas');
      if (canvas) {
        qrDownload.href = canvas.toDataURL('image/png');
        qrDownload.style.display = 'inline-block';
        qrDownload.textContent = '⬇️ Download QR';
      } else {
        qrDownload.style.display = 'none';
      }
    }
  }, 80);
});
