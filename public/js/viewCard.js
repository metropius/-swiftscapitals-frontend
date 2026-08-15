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

  function maskCardNumber(num) {
    const s = String(num || '');
    if (s.length < 8) return s || '—';
    return s.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 **** **** $4');
  }

  function statusClass(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'active') return 'bg-green-100 text-green-800';
    if (s === 'suspended' || s === 'expired' || s === 'declined') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  }

  function formatDate(value) {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch (_) {
      return '—';
    }
  }

  function renderCard(card) {
    const cardType = card.cardType || '—';
    const cardLevel = card.cardLevel || '';
    const statusRaw = card.status || 'pending';
    const statusLabel =
      statusRaw.charAt(0).toUpperCase() + String(statusRaw).slice(1);
    const currency = card.currency || '';
    const balance = Number(card.balance || 0).toFixed(2);
    const dailyLimit = Number(card.dailyLimit || 0).toLocaleString();
    const masked = maskCardNumber(card.cardNumber);

    document.getElementById('card-title').textContent =
      `${String(cardType).toUpperCase()} ${cardLevel} Card`.trim();
    document.getElementById('card-subtitle').textContent =
      `${masked} - ${statusLabel}`;

    document.getElementById('field-cardType').textContent = cardType;
    document.getElementById('field-cardLevel').textContent = cardLevel || '—';
    document.getElementById('field-cardNumber').textContent = masked;
    document.getElementById('field-expiry').textContent = card.expiryDate || '—';
    document.getElementById('field-holder').textContent = card.cardHolderName || '—';

    document.getElementById('field-currency').textContent = currency || '—';
    document.getElementById('field-balance').textContent =
      `${currency} ${balance}`.trim();
    document.getElementById('field-dailyLimit').textContent =
      `${currency} ${dailyLimit}`.trim();

    const statusEl = document.getElementById('field-status');
    statusEl.textContent = statusLabel;
    statusEl.className =
      'inline-flex px-3 py-1 text-sm font-medium rounded-full ' +
      statusClass(statusRaw);

    const rejectionWrap = document.getElementById('rejection-wrap');
    if (card.rejectionReason) {
      rejectionWrap.classList.remove('hidden');
      document.getElementById('field-rejection').textContent = card.rejectionReason;
    } else {
      rejectionWrap.classList.add('hidden');
    }

    const owner = card.owner || {};
    document.getElementById('owner-name').textContent =
      `${owner.firstname || '—'} ${owner.lastname || ''}`.replace(/\s+/g, ' ').trim();
    document.getElementById('owner-email').textContent = owner.email || '—';
    document.getElementById('owner-phone').textContent = owner.phone || '—';
    document.getElementById('owner-country').textContent = owner.country || '—';

    document.getElementById('field-applicationDate').textContent = formatDate(
      card.applicationDate || card.createdAt
    );
    document.getElementById('field-activationDate').textContent = formatDate(
      card.activationDate
    );
    document.getElementById('field-created').textContent = formatDate(card.createdAt);
    document.getElementById('field-updated').textContent = formatDate(card.updatedAt);

    const editBtn = document.getElementById('edit-card-btn');
    if (editBtn && card._id) {
      editBtn.href = `editCard.html?id=${card._id}`;
    }
  }

  async function loadCard() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No card ID provided',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'all-cards.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewCard/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.card) {
        throw new Error(data?.message || 'Card not found');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      renderCard(data.card);
    } catch (err) {
      console.error('View card error:', err);
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
        text: err.response?.data?.message || err.message || 'Failed to load card',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'all-cards.html';
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

    loadCard();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();