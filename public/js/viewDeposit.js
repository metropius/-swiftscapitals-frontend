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

  function renderDeposit(deposit) {
    const type = deposit.type || deposit.payment_method || 'Deposit';
    const amount = deposit.amount != null ? String(deposit.amount) : '0.00';
    const statusRaw = deposit.status || 'pending';
    const statusLabel =
      statusRaw.charAt(0).toUpperCase() + String(statusRaw).slice(1);

    document.getElementById('deposit-title').textContent = `${type} Deposit`;
    document.getElementById('deposit-subtitle').textContent =
      `${amount} - ${statusLabel}`;

    document.getElementById('field-type').textContent = type;
    document.getElementById('field-amount').textContent = amount;

    const statusEl = document.getElementById('field-status');
    statusEl.textContent = statusLabel;
    statusEl.className =
      'inline-flex px-3 py-1 text-sm font-medium rounded-full ' +
      statusClass(statusRaw);

    document.getElementById('field-method').textContent =
      deposit.payment_method || deposit.type || '—';
    document.getElementById('field-narration').textContent =
      deposit.narration || '—';

    const owner = deposit.owner || {};
    document.getElementById('owner-name').textContent =
      `${owner.firstname || '—'} ${owner.lastname || ''}`.replace(/\s+/g, ' ').trim();
    document.getElementById('owner-email').textContent = owner.email || '—';
    document.getElementById('owner-phone').textContent = owner.phone || '—';
    document.getElementById('owner-country').textContent = owner.country || '—';

    const proofContainer = document.getElementById('proof-container');
    const proofUrl = deposit.image || deposit.proofImage || null;
    if (proofUrl) {
      proofContainer.innerHTML = `
        <div class="mt-2">
          <img src="${proofUrl}" alt="Deposit Proof"
               class="max-w-full h-auto rounded-lg shadow-md object-contain"
               onerror="this.parentElement.innerHTML='<p class=\\'text-gray-500 italic\\'>Image could not be loaded</p>'">
        </div>
      `;
    } else {
      proofContainer.innerHTML =
        '<p class="text-gray-500 italic">No proof image uploaded</p>';
    }

    document.getElementById('field-created').textContent = deposit.createdAt
      ? new Date(deposit.createdAt).toLocaleString()
      : '—';
    document.getElementById('field-updated').textContent = deposit.updatedAt
      ? new Date(deposit.updatedAt).toLocaleString()
      : '—';

    const editBtn = document.getElementById('edit-deposit-btn');
    if (editBtn && deposit._id) {
      editBtn.href = `editDeposit.html?id=${deposit._id}`;
    }
  }

  async function loadDeposit() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No deposit ID provided',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allFunding.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewDeposit/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.deposit) {
        throw new Error(data?.message || 'Deposit not found');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      renderDeposit(data.deposit);
    } catch (err) {
      console.error('View deposit error:', err);
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
        text: err.response?.data?.message || err.message || 'Failed to load deposit',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allFunding.html';
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

    loadDeposit();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();