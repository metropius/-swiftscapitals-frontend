(function () {
  function hideLoader() {
    const el = document.getElementById('pageLoader');
    if (!el) return;
    el.classList.remove('active');
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 400);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null || value === '' ? '—' : String(value);
  }

  function formatMoney(currency, amount) {
    const cur = currency || '$';
    const num = Number(amount || 0);
    return `${cur}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
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

  function renderUser(user) {
    const fullName =
      `${user.firstname || ''} ${user.midname || ''} ${user.lastname || ''}`
        .replace(/\s+/g, ' ')
        .trim() || 'User';
    const initials =
      `${(user.firstname || '').charAt(0)}${(user.lastname || '').charAt(0)}`.toUpperCase() || '—';
    const currency = user.currency || '$';

    document.title = `swiftcaptial | View User - ${fullName}`;

    setText('user-full-name', fullName);
    setText('user-email', user.email || '—');
    setText('detail-fullname', fullName);
    setText('detail-gender', user.gender || '—');
    setText('detail-dob', user.Dob || user.dob || '—');
    setText('detail-phone', user.phone || '—');
    setText('detail-account-no', user.account_no || '—');
    setText('detail-account-type', user.accounttype || '—');
    setText('detail-currency', currency);
    setText('detail-balance', formatMoney(currency, user.balance));
    setText('detail-total-deposit', formatMoney(currency, user.total_deposit));
    setText('detail-address', user.address || '—');

    const cityState = [user.city, user.state].filter(Boolean).join(', ') || '—';
    setText('detail-city-state', cityState);
    setText('detail-country', user.country || '—');

    const accountStatus = document.getElementById('detail-account-status');
    if (accountStatus) {
      if (user.isSuspended) {
        accountStatus.textContent = 'Suspended';
        accountStatus.className =
          'inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800';
      } else {
        accountStatus.textContent = 'Active';
        accountStatus.className =
          'inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800';
      }
    }

    const otpStatus = document.getElementById('detail-otp-status');
    if (otpStatus) {
      if (user.otpSuspended) {
        otpStatus.textContent = 'Suspended';
        otpStatus.className =
          'inline-flex px-3 py-1 text-sm font-medium rounded-full bg-orange-100 text-orange-800';
      } else {
        otpStatus.textContent = 'Enabled';
        otpStatus.className =
          'inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800';
      }
    }

    setText('detail-created', formatDate(user.createdAt));
    setText('detail-updated', formatDate(user.updatedAt));
    setText('detail-email-verified', user.isVerified ? 'Yes' : 'No');
    setText(
      'detail-kyc',
      `${user.kycVerified ? 'Yes' : 'No'} (${user.verifiedStatus || 'not Verified!'})`
    );

    const fallback = document.getElementById('user-avatar-fallback');
    const img = document.getElementById('user-avatar-img');
    if (user.image && img) {
      img.src = user.image;
      img.alt = fullName;
      img.classList.remove('hidden');
      if (fallback) fallback.classList.add('hidden');
    } else if (fallback) {
      fallback.textContent = initials;
      fallback.classList.remove('hidden');
      if (img) img.classList.add('hidden');
    }

    const editBtn = document.getElementById('editUserBtn');
    if (editBtn && user._id) {
      editBtn.href = `editUser.html?id=${user._id}`;
    }
  }

  async function loadViewUser() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'Missing user',
        text: 'No user ID provided.',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'adminDashboard.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewUser/${userId}`);
      const data = res.data;

      if (!data || data.success === false || !data.user) {
        throw new Error(data?.message || 'User not found');
      }

      if (data.admin || data.currentUser) {
        const adminUser = data.admin || data.currentUser;
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      } else if (typeof getCurrentUser === 'function') {
        populateAdminUI(getCurrentUser());
      }

      renderUser(data.user);
    } catch (err) {
      console.error('View user error:', err);
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
        text: err.response?.data?.message || err.message || 'Could not load user details',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'adminDashboard.html';
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

    if (typeof getCurrentUser === 'function') {
      populateAdminUI(getCurrentUser());
    }

    loadViewUser();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();