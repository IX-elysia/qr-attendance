let attendance = [];
let html5QrCode = null;

// Switch tabs
function showSection(id) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "attendance") renderAttendance();
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-camera");
  const stopBtn = document.getElementById("stop-camera");

  // Start Camera
  startBtn.addEventListener("click", () => {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("qr-reader");
    }
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        addToAttendance(decodedText);
      },
      (err) => {
        console.warn(err);
      }
    ).catch(err => console.error("Camera start failed:", err));
  });

  // Stop Camera
  stopBtn.addEventListener("click", () => {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        console.log("Camera stopped.");
      }).catch(err => console.error("Failed to stop camera:", err));
    }
  });

  // Manual input
  document.getElementById("add-manual").addEventListener("click", () => {
    const name = document.getElementById("manual-name").value.trim();
    if (name) {
      addToAttendance(name);
      document.getElementById("manual-name").value = "";
    }
  });

  // Refresh attendance
  document.getElementById("refresh-attendance").addEventListener("click", () => {
    renderAttendance();
  });

  // Clear attendance
  document.getElementById("clear-attendance").addEventListener("click", () => {
    attendance = [];
    renderAttendance();
  });

  // Export to Excel (CSV file)
  document.getElementById("export-btn").addEventListener("click", () => {
    if (attendance.length === 0) {
      alert("No attendance to export!");
      return;
    }
    let csv = "Name,Time\n";
    attendance.forEach(item => {
      csv += `${item.name},${item.time}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "attendance.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});

// Add to attendance list
function addToAttendance(name) {
  const now = new Date();
  const time = now.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
  attendance.push({ name, time });
  renderAttendance();
  alert(`${name} recorded at ${time}`);
}

// Render attendance list
function renderAttendance() {
  const list = document.getElementById("attendance-list");
  list.innerHTML = "";
  attendance.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.time}`;
    list.appendChild(li);
  });

  document.getElementById("attendance-counter").textContent = `Total attendees: ${attendance.length}`;
}
