// Fetch attendance data
async function loadAttendance() {
  try {
    const res = await fetch('/attendance');
    const data = await res.json();

    const list = document.getElementById('attendanceList');
    const summary = document.getElementById('attendanceSummary');
    list.innerHTML = '';

    if (Object.keys(data).length === 0) {
      summary.textContent = "No attendance records yet.";
      return;
    }

    let total = 0;
    let count = 0;

    Object.entries(data).forEach(([name, record]) => {
      const li = document.createElement('li');
      li.textContent = `${name} - ${record.time}`;
      list.appendChild(li);

      total++;
      count++;
    });

    const percentage = ((count / total) * 100).toFixed(2);
    summary.textContent = `Total attendees: ${count}. Attendance rate: ${percentage}%`;
  } catch (err) {
    console.error("Error loading attendance:", err);
  }
}

// Export to Excel
document.getElementById('exportBtn').addEventListener('click', async () => {
  window.location.href = '/export';
});

loadAttendance();
