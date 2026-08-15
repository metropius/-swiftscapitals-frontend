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

  function formatDate(value) {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch (_) {
      return '—';
    }
  }

  function renderWallet(wallet) {
    document.getElementById('wallet-title').textContent = 'Payment Wallets';
    document.getElementById('wallet-subtitle').textContent =
      wallet.updatedBy
        ? `Last updated by ${wallet.updatedBy.firstname || ''} ${wallet.updatedBy.lastname || ''}`.trim()
        : 'Last updated by admin';

    document.getElementById('field-bank_name').textContent = wallet.bank_name || '—';
    document.getElementById('field-account_name').textContent = wallet.account_name || '—';
    document.getElementById('field-account_no').textContent = wallet.account_no || '—';
    document.getElementById('field-sortcode').textContent = wallet.sortcode || '—';
    document.getElementById('field-swift_code').textContent = wallet.swift_code || '—';

    document.getElementById('field-btc_wallet_address').textContent =
      wallet.btc_wallet_address || '—';

    const qrContainer = document.getElementById('qr-container');
    if (wallet.btc_qr_image) {
      qrContainer.innerHTML = `
        <img src="${wallet.btc_qr_image}" alt="BTC QR Code"
             class="w-48 h-48 object-contain rounded-lg shadow-md mt-2"
             onerror="this.parentElement.innerHTML='<p class=\\'text-gray-500 italic\\'>QR image could not be loaded</p>'">
      `;
    } else {
      qrContainer.innerHTML = '<p class="text-gray-500 italic">No QR code uploaded</p>';
    }

    document.getElementById('field-paypal_email').textContent =
      wallet.paypal_email || '—';

    if (wallet.updatedBy) {
      document.getElementById('field-updatedBy').textContent =
        `${wallet.updatedBy.firstname || ''} ${wallet.updatedBy.lastname || ''}`.replace(/\s+/g, ' ').trim() || '—';
    } else {
      document.getElementById('field-updatedBy').textContent = '—';
    }

    document.getElementById('field-created').textContent = formatDate(wallet.createdAt);
    document.getElementById('field-updated').textContent = formatDate(wallet.updatedAt);

    const editBtn = document.getElementById('edit-wallet-btn');
    if (editBtn && wallet._id) {
      editBtn.href = `editWallet.html?id=${wallet._id}`;
    }
  }

  async function loadWallet() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No wallet ID provided',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'wallets.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewWallet/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.wallet) {
        throw new Error(data?.message || 'Wallet not found');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      renderWallet(data.wallet);
    } catch (err) {
      console.error('View wallet error:', err);
      if (err.response?.status === 401) {
        if (typeof logout === 'function') logout();
        else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'login.html';
        }
        return;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to load wallet',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'wallets.html';
      });
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

    loadWallet();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();