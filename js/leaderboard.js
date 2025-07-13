// leaderboard.js

function loadLeaderboard() {
  const data = JSON.parse(localStorage.getItem("leaderboard") || "[]");

  // Sắp xếp theo: vòng cao nhất → thời gian ít nhất
  data.sort((a, b) => b.level - a.level || a.time - b.time);

  const tbody = document.getElementById("leaderboardBody");
  tbody.innerHTML = "";

  data.forEach((entry, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.level}</td>
      <td>${entry.time}</td>
    `;
    tbody.appendChild(tr);
  });
}

function clearLeaderboard() {
  if (confirm("Bạn có chắc muốn xoá bảng xếp hạng?")) {
    localStorage.removeItem("leaderboard");
    loadLeaderboard();
  }
}

// Gọi khi trang được tải
window.onload = loadLeaderboard;
