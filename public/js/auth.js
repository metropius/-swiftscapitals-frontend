function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function getCurrentUser() {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function logout() {
  // 1. Clear local storage first
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // 2. Optional: try to clear backend cookie (don't wait for it)
  if (typeof api !== 'undefined') {
    api.get('/logout').catch(() => {}); // ignore any error
  } else if (typeof axios !== 'undefined' && typeof API_BASE_URL !== 'undefined') {
    axios.get(`${API_BASE_URL}/logout`, { withCredentials: true }).catch(() => {});
  }

  // 3. Redirect to homepage
  window.location.href = 'index.html';
}

function requireAuthPage() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}