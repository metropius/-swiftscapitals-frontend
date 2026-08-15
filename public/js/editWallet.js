(function () {
  let walletId = null;

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

  function fillForm(wallet) {
    walletId = wallet._id;

    document.getElementById('bank_name').value = wallet.bank_name || '';
    document.getElementById('account_name').value = wallet.account_name || '';
    document.getElementById('account_no').value = wallet.account_no || '';
    document.getElementById('sortcode').value = wallet.sortcode || '';
    document.getElementById('swift_code').value = wallet.swift_code || '';
    document.getElementById('btc_wallet_address').value = wallet.btc_wallet_address || '';
    document.getElementById('paypal_email').value = wallet.paypal_email || '';

    const qrWrap = document.getElementById('current-qr-wrap');
    const qrImg = document.getElementById('current-qr-img');
    if (wallet.btc_qr_image && qrWrap && qrImg) {
      qrImg.src = wallet.btc_qr_image;
      qrWrap.classList.remove('hidden');
    } else if (qrWrap) {
      qrWrap.classList.add('hidden');
    }

    const viewLink = document.getElementById('view-wallet-link');
    const cancelLink = document.getElementById('cancel-link');
    if (viewLink) viewLink.href = `viewWallet.html?id=${wallet._id}`;
    if (cancelLink) cancelLink.href = `viewWallet.html?id=${wallet._id}`;
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

      const res = await api.get(`/editWallet/${id}`);
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

      fillForm(data.wallet);
    } catch (err) {
      console.error('Edit wallet load error:', err);
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

    document.getElementById('editWalletForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!walletId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Wallet ID missing',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      const btn = document.getElementById('saveBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
      }

      const formData = new FormData(e.target);

      try {
        if (typeof api === 'undefined') {
          throw new Error('API client not loaded');
        }

        const res = await api.put(`/editWallet/${walletId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const data = res.data;

        if (!data || !data.success) {
          throw new Error(data?.message || 'Failed to update wallet');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message || 'Wallet updated successfully',
          timer: 2200,
          showConfirmButton: false
        });

        window.location.href = 'wallets.html';
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Something went wrong while saving',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Save Changes';
        }
      }
    });
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();