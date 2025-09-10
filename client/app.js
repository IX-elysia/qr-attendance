// app.js — manages UI + QR scanning + API calls
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  const name = t.dataset.tab;
  panels.forEach(p => p.classList.toggle('active', p.id === name));

  if (name === "scan") {
    // Start scanner when Scan tab is opened
    startScanner();
  } else {
    // Stop scanner when leaving Scan tab
    stopScanner();
  }
}));

const statusEl = document.getElementById('scan-status');
const qrRegion = document.getElementById('qr-reader');
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
    showStatus("Camera ready — scan a QR code.");
  }).catch(err => {
    showStatus('Camera start failed — please allow permission. ' + err);
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

// Manual submit
document.getElementById('manual-submit').addEventListener('click', ()=>{
  const n = document.getElementById('manual-name').value.trim();
  if (!n) return showStatus('Enter a name');
  handleQrPayload(n);
});

// Refresh attendance list
async function refreshList(){
  const listEl = document.getElementById('list');
  listEl.innerHTML = 'Loading...';
  try {
    const res = await fetch('/api/attendance');
    const arr = await res.json();
    if (!arr.length) listEl.innerHTML = '<div class="item">No records yet</div>';
    else listEl.innerHTML = arr.slice().reverse().map(r => `
      <div class="item"><div>
        <strong>${escapeHtml(r.name)}</strong><div style="font-size:12px;color:var(--muted)">ID: ${escapeHtml(r.id||'—')}</div>
      </div><div style="text-align:right"><div style="font-size:12px;color:var(--muted)">${new Date(r.timestamp).toLocaleString()}</div></div></div>
    `).join('');
  }catch(e){ listEl.innerHTML = 'Could not load'; }
}

function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>\"']/g, c=> ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' })[c]);
}

// Export button
document.getElementById('export-btn').addEventListener('click', ()=>{
  window.location.href = '/api/export';
});

// Refresh control
document.getElementById('refresh-list').addEventListener('click', refreshList);

// Clear local UI
document.getElementById('clear-local').addEventListener('click', ()=>{
  document.getElementById('list').innerHTML = '';
});

// Initialize attendance list only
window.addEventListener('load', ()=> refreshList());
