(function () {
  let currentUserId = null;
  let otpSuspended = false;

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

  function updateOtpUI() {
    const badge = document.getElementById('otpStatusBadge');
    const btn = document.getElementById('toggleOtpBtn');

    if (badge) {
      if (otpSuspended) {
        badge.textContent = 'Suspended';
        badge.className =
          'ml-3 inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800';
      } else {
        badge.textContent = 'Active';
        badge.className =
          'ml-3 inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800';
      }
    }

    if (btn) {
      if (otpSuspended) {
        btn.textContent = 'Enable OTP Verification';
        btn.className =
          'px-6 py-2.5 font-medium rounded-lg shadow-sm transition-colors bg-green-600 hover:bg-green-700 text-white';
      } else {
        btn.textContent = 'Suspend OTP Verification';
        btn.className =
          'px-6 py-2.5 font-medium rounded-lg shadow-sm transition-colors bg-orange-600 hover:bg-orange-700 text-white';
      }
    }
  }

  function fillForm(user) {
    currentUserId = user._id;
    otpSuspended = !!user.otpSuspended;

    document.title = `swiftcaptial | Edit User - ${user.firstname || ''} ${user.lastname || ''}`.trim();

    const firstname = document.getElementById('firstname');
    const lastname = document.getElementById('lastname');
    const phone = document.getElementById('phone');
    const country = document.getElementById('country');
    const address = document.getElementById('address');
    const balance = document.getElementById('balance');
    const limit = document.getElementById('limit');
    const currencyLabel = document.getElementById('currencyLabel');

    if (firstname) firstname.value = user.firstname || '';
    if (lastname) lastname.value = user.lastname || '';
    if (phone) phone.value = user.phone || '';
    if (country) country.value = user.country || '';
    if (address) address.value = user.address || '';
    if (balance) balance.value = user.balance != null ? Number(user.balance) : 0;
    if (limit) limit.value = user.limit != null ? String(user.limit) : '';
    if (currencyLabel) currencyLabel.textContent = user.currency || '$';

    const viewLink = document.getElementById('viewProfileLink');
    const cancelLink = document.getElementById('cancelLink');
    if (viewLink) viewLink.href = `viewUser.html?id=${user._id}`;
    if (cancelLink) cancelLink.href = `viewUser.html?id=${user._id}`;

    updateOtpUI();
  }

  async function loadEditUser() {
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

      let res;
      try {
        res = await api.get(`/editUser/${userId}`);
      } catch (e) {
        res = await api.get(`/viewUser/${userId}`);
      }

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

      fillForm(data.user);
    } catch (err) {
      console.error('Edit user load error:', err);
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
        text: err.response?.data?.message || err.message || 'Could not load user',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'adminDashboard.html';
      });
    } finally {
      hideLoader();
      lucide.createIcons();
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!currentUserId) return;

    const form = e.target;
    const formData = Object.fromEntries(new FormData(form));
    if (formData.balance !== undefined && formData.balance !== '') {
      formData.balance = Number(formData.balance);
    }

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn ? saveBtn.textContent : 'Save Changes';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const res = await api.put(`/editUser/${currentUserId}`, formData);
      const data = res.data;

      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to update user');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: data.message || 'User updated successfully',
        timer: 2200,
        showConfirmButton: false
      });

      window.location.href = `viewUser.html?id=${currentUserId}`;
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Something went wrong while saving',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    }
  }

  async function handleToggleOtp() {
    if (!currentUserId) return;

    const action = otpSuspended ? 'enable' : 'suspend';
    const endpoint = otpSuspended
      ? `/unsuspendOTP/${currentUserId}`
      : `/suspendOTP/${currentUserId}`;

    const swalResult = await Swal.fire({
      title: `Confirm OTP ${action}`,
      text: `Are you sure you want to ${action} OTP verification for this user?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'enable' ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelButtonText: 'No, keep current'
    });

    if (!swalResult.isConfirmed) return;

    try {
      const res = await api.get(endpoint);
      const data = res.data;

      if (!data || !data.success) {
        throw new Error(data?.message || `Failed to ${action} OTP`);
      }

      otpSuspended = !otpSuspended;
      updateOtpUI();

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: data.message || `OTP verification has been ${action}d`,
        timer: 2200,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to update OTP status',
        confirmButtonColor: '#ef4444'
      });
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

    document.getElementById('editUserForm')?.addEventListener('submit', handleSave);
    document.getElementById('toggleOtpBtn')?.addEventListener('click', handleToggleOtp);

    loadEditUser();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();