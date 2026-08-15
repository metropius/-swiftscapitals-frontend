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

  function renderLoan(loan) {
    const category = loan.loan_category || 'Loan';
    const amount = loan.loan_amount != null ? String(loan.loan_amount) : '—';
    const statusRaw = loan.status || 'pending';
    const statusLabel =
      statusRaw.charAt(0).toUpperCase() + String(statusRaw).slice(1);

    document.getElementById('loan-title').textContent = `${category} Loan`;
    document.getElementById('loan-subtitle').textContent =
      `${amount} - ${statusLabel}`;

    document.getElementById('field-amount').textContent = amount;
    document.getElementById('field-category').textContent =
      loan.loan_category || '—';
    document.getElementById('field-duration').textContent =
      loan.loan_duration || '—';
    document.getElementById('field-income').textContent =
      loan.loan_income || '—';
    document.getElementById('field-reason').textContent =
      loan.loan_reason || '—';

    const statusEl = document.getElementById('field-status');
    statusEl.textContent = statusLabel;
    statusEl.className =
      'inline-flex px-3 py-1 text-sm font-medium rounded-full ' +
      statusClass(statusRaw);

    const owner = loan.owner || {};
    document.getElementById('owner-name').textContent =
      `${owner.firstname || '—'} ${owner.lastname || ''}`.replace(/\s+/g, ' ').trim();
    document.getElementById('owner-email').textContent = owner.email || '—';
    document.getElementById('owner-phone').textContent = owner.phone || '—';
    document.getElementById('owner-country').textContent = owner.country || '—';

    document.getElementById('field-created').textContent = formatDate(
      loan.createdAt
    );
    document.getElementById('field-updated').textContent = formatDate(
      loan.updatedAt
    );

    const editBtn = document.getElementById('edit-loan-btn');
    if (editBtn && loan._id) {
      editBtn.href = `editLoan.html?id=${loan._id}`;
    }
  }

  async function loadLoan() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No loan ID provided',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allLoans.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewLoans/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.loan) {
        throw new Error(data?.message || 'Loan not found');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      renderLoan(data.loan);
    } catch (err) {
      console.error('View loan error:', err);
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
        text: err.response?.data?.message || err.message || 'Failed to load loan',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allLoans.html';
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

    loadLoan();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();