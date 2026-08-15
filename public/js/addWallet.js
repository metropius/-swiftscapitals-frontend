(function () {
  function hideLoader() {
    const el = document.getElementById('pageLoader');
    if (!el) return;
    el.classList.remove('active');
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 400);
  }

  function populateAdminUI(user) {
    if (!user) return;
    const fullName =
      `${user.firstname || ''} ${user.midname || ''} ${user.lastname || ''}`
        .replace(/\s+/g, ' ')
        .trim() || 'Admin';
    const avatar =
      user.image ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0ea5e9&color=fff`;

    const nameEl = document.getElementById('admin-name');
    const emailEl = document.getElementById('admin-email');
    const avatarEl = document.getElementById('admin-avatar');

    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = user.email || '—';
    if (avatarEl) {
      avatarEl.src = avatar;
      avatarEl.alt = fullName;
    }
  }

  async function bootstrapAdmin() {
    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      let adminUser =
        typeof getCurrentUser === 'function' ? getCurrentUser() : null;

      if (!adminUser) {
        try {
          adminUser = JSON.parse(localStorage.getItem('user') || 'null');
        } catch (_) {
          adminUser = null;
        }
      }

      if (!adminUser) {
        const res = await api.get('/addWallet');
        const data = res.data;
        if (data && data.success && data.admin) {
          adminUser = data.admin;
        }
      }

      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }
    } catch (err) {
      console.error('Add wallet bootstrap error:', err);
      if (err.response?.status === 401) {
        if (typeof logout === 'function') logout();
        else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'login.html';
        }
      }
    } finally {
      hideLoader();
      lucide.createIcons();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof requireAuthPage === 'function') {
      requireAuthPage();
    } else if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    } else if (!localStorage.getItem('token')) {
      window.location.href = 'login.html';
      return;
    }

    bootstrapAdmin();

    document.getElementById('addWalletForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = document.getElementById('saveBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating...';
      }

      const formData = new FormData(e.target);

      try {
        if (typeof api === 'undefined') {
          throw new Error('API client not loaded');
        }

        const res = await api.post('/addWallet', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const data = res.data;

        if (!data || !data.success) {
          throw new Error(data?.message || 'Failed to create wallet');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message || 'Wallet created successfully',
          timer: 2200,
          showConfirmButton: false
        });

        window.location.href = 'wallets.html';
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Something went wrong while creating wallet',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Create Wallet';
        }
      }
    });
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();