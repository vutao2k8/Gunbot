document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("menuMusic");
  const musicBtn = document.getElementById("musicBtn");

  const name = localStorage.getItem("username") || "Người chơi";
  const character = localStorage.getItem("character") || "chưa chọn";
  document.getElementById("playerName").textContent = name;
  document.getElementById("characterChosen").textContent = character;

  window.startGame = () => {
    window.location.href = "game.html";
  };

  window.toggleMusic = function () {
    if (music.paused || music.ended) {
      music.play().then(() => {
        musicBtn.textContent = "🔈 Tắt nhạc";
      }).catch(() => {
        alert("⚠️ Trình duyệt đang chặn phát nhạc tự động.");
        musicBtn.textContent = "🔇 Bật nhạc";
      });
    } else {
      music.pause();
      musicBtn.textContent = "🔇 Bật nhạc";
    }
  };

  window.addEventListener("beforeunload", () => {
    if (music) music.pause();
  });
});
