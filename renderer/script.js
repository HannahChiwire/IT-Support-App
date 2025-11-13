const { ipcRenderer } = require('electron');

const loginForm = document.getElementById('loginForm');
const registerLink = document.getElementById('registerLink');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = await ipcRenderer.invoke('login', { email, password });
    if (!user) return alert('Invalid credentials!');

    localStorage.setItem('user', JSON.stringify(user));

    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'user.html';
    }
  });
}

if (registerLink) {
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'register.html';
  });
}
