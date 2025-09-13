async function loadAttendance() {
  const res = await fetch("/api/attendance");
  const data = await res.json();
  const list = document.getElementById("attendance-list");
  list.innerHTML = "";
  data.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} - ${entry.date} ${entry.time}`;
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadAttendance();

  document.getElementById("clear-list").addEventListener("click", async () => {
    await fetch("/api/attendance", { method: "DELETE" });
    loadAttendance();
  });
});
