// login.js
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const character = document.getElementById("character").value;
    localStorage.setItem("character", character);
  
    if (!username || !password || !character) {
      alert("Vui lòng nhập đầy đủ thông tin và chọn nhân vật!");
      return;
    }
  
    localStorage.setItem("username", username);
    localStorage.setItem("character", character.value);
  
    window.location.href = "menu.html";
  }
  
