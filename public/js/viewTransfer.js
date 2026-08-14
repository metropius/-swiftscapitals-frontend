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

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusClass(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'rejected' || s === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  function fieldRow(label, value) {
    return `
      <div>
        <span class="text-sm text-gray-500 block">${escapeHtml(label)}</span>
        <p class="font-medium">${escapeHtml(value != null && value !== '' ? value : '—')}</p>
      </div>
    `;
  }

  function renderDestination(transfer) {
    const container = document.getElementById('destination-fields');
    if (!container) return;

    const type = transfer.type || '';

    if (type === 'Local Transfer') {
      container.innerHTML =
        fieldRow('Bank', transfer.Bank || transfer.bankname) +
        fieldRow('Account Name', transfer.accountname) +
        fieldRow('Account Number', transfer.accountnumber) +
        fieldRow('Account Type', transfer.Accounttype);
      return;
    }

    if (type === 'International Wire') {
      container.innerHTML =
        fieldRow('Bank Name', transfer.bankname) +
        fieldRow('Account Name', transfer.accountname) +
        fieldRow('Account Number', transfer.accountnumber) +
        fieldRow('Bank Address', transfer.bank_Address) +
        fieldRow('IBAN', transfer.bank_iban) +
        fieldRow('SWIFT Code', transfer.swiftCode) +
        fieldRow('Country', transfer.country);
      return;
    }

    if (type === 'Cryptocurrency') {
      container.innerHTML =
        fieldRow('Crypto Currency', transfer.cryptoCurrency) +
        fieldRow('Network', transfer.cryptoNetwork) +
        fieldRow('Wallet Address', transfer.walletAddress);
      return;
    }

    if (type === 'PayPal') {
      container.innerHTML = fieldRow('PayPal Email', transfer.paypalEmail);
      return;
    }

    if (type === 'Wise Transfer') {
      container.innerHTML =
        fieldRow('Full Name', transfer.wiseFullName) +
        fieldRow('Email', transfer.wiseEmail) +
        fieldRow('Country', transfer.wiseCountry);
      return;
    }

    if (type === 'Skrill') {
      container.innerHTML =
        fieldRow('Email', transfer.skrillEmail) +
        fieldRow('Full Name', transfer.skrillFullName);
      return;
    }

    if (type === 'Venmo') {
      container.innerHTML =
        fieldRow('Username', transfer.venmoUsername) +
        fieldRow('Phone', transfer.venmoPhone);
      return;
    }

    if (type === 'Zelle') {
      container.innerHTML =
        fieldRow('Email', transfer.zelleEmail) +
        fieldRow('Phone', transfer.zellePhone) +
        fieldRow('Name', transfer.zelleName);
      return;
    }

    if (type === 'Cash App') {
      container.innerHTML =
        fieldRow('Cashtag', transfer.cashAppTag) +
        fieldRow('Full Name', transfer.cashAppFullName);
      return;
    }

    if (type === 'Revolut') {
      container.innerHTML =
        fieldRow('Full Name', transfer.revolutFullName) +
        fieldRow('Email', transfer.revolutEmail) +
        fieldRow('Phone', transfer.revolutPhone);
      return;
    }

    if (type === 'Alipay') {
      container.innerHTML =
        fieldRow('Alipay ID', transfer.alipayId) +
        fieldRow('Full Name', transfer.alipayFullName);
      return;
    }

    if (type === 'WeChat Pay') {
      container.innerHTML =
        fieldRow('WeChat ID', transfer.wechatId) +
        fieldRow('Name', transfer.wechatName);
      return;
    }

    container.innerHTML =
      '<p class="text-gray-500 italic">Destination details not applicable for this transfer type</p>';
  }

  function renderTransfer(transfer) {
    const type = transfer.type || 'Transfer';
    const amount = transfer.amount != null ? String(transfer.amount) : '0.00';
    const from = String(transfer.transferFrom || 'usd').toUpperCase();
    const statusRaw = transfer.status || 'pending';
    const statusLabel =
      statusRaw.charAt(0).toUpperCase() + String(statusRaw).slice(1);

    document.getElementById('transfer-title').textContent = type;
    document.getElementById('transfer-subtitle').textContent =
      `${amount} from ${from} - ${statusLabel}`;

    document.getElementById('field-type').textContent = type;
    document.getElementById('field-amount').textContent = amount;
    document.getElementById('field-from').textContent = from;

    const statusEl = document.getElementById('field-status');
    statusEl.textContent = statusLabel;
    statusEl.className =
      'inline-flex px-3 py-1 text-sm font-medium rounded-full ' +
      statusClass(statusRaw);

    document.getElementById('field-note').textContent = transfer.note || '—';

    renderDestination(transfer);

    const owner = transfer.owner || {};
    document.getElementById('owner-name').textContent =
      `${owner.firstname || '—'} ${owner.lastname || ''}`.replace(/\s+/g, ' ').trim();
    document.getElementById('owner-email').textContent = owner.email || '—';
    document.getElementById('owner-phone').textContent = owner.phone || '—';
    document.getElementById('owner-country').textContent = owner.country || '—';

    document.getElementById('field-created').textContent = transfer.createdAt
      ? new Date(transfer.createdAt).toLocaleString()
      : '—';
    document.getElementById('field-updated').textContent = transfer.updatedAt
      ? new Date(transfer.updatedAt).toLocaleString()
      : '—';

    const editBtn = document.getElementById('edit-transfer-btn');
    if (editBtn && transfer._id) {
      editBtn.href = `editTransfer.html?id=${transfer._id}`;
    }
  }

  async function loadTransfer() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No transfer ID provided',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allTransfer.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewTransfer/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.transfer) {
        throw new Error(data?.message || 'Transfer not found');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      renderTransfer(data.transfer);
    } catch (err) {
      console.error('View transfer error:', err);
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
        text: err.response?.data?.message || err.message || 'Failed to load transfer',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allTransfer.html';
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

    loadTransfer();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();