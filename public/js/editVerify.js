(function () {
  let currentVerifyId = null;

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

  function toggleRejectionReason(status) {
    const group = document.getElementById('rejectionReasonGroup');
    if (!group) return;
    group.style.display = ['rejected', 'declined'].includes(status) ? 'block' : 'none';
  }

  function fillForm(verification) {
    currentVerifyId = verification._id;

    const statusSelect = document.getElementById('status');
    const reasonField = document.getElementById('rejectionReason');
    const viewLink = document.getElementById('viewVerifyLink');
    const cancelLink = document.getElementById('cancelLink');

    const status = verification.status || 'pending';
    if (statusSelect) {
      statusSelect.value = status;
      const options = Array.from(statusSelect.options);
      const match = options.find((o) => o.value === status);
      if (!match && status) {
        const opt = document.createElement('option');
        opt.value = status;
        opt.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        opt.selected = true;
        statusSelect.appendChild(opt);
      }
    }

    if (reasonField) reasonField.value = verification.rejectionReason || '';

    toggleRejectionReason(status);

    if (viewLink) viewLink.href = `viewVerify.html?id=${verification._id}`;
    if (cancelLink) cancelLink.href = `viewVerify.html?id=${verification._id}`;

    document.title = `swiftcaptial | Edit KYC - ${verification.fullname || verification._id || ''}`;
  }

  async function loadEditVerify() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No verification ID provided.',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allVerify.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      let res;
      try {
        res = await api.get(`/editVerify/${id}`);
      } catch (e) {
        res = await api.get(`/viewVerify/${id}`);
      }

      const data = res.data;

      if (!data || data.success === false || !data.verification) {
        throw new Error(data?.message || 'Verification not found');
      }

      if (data.admin || data.currentUser) {
        const adminUser = data.admin || data.currentUser;
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      } else if (typeof getCurrentUser === 'function') {
        populateAdminUI(getCurrentUser());
      }

      fillForm(data.verification);
    } catch (err) {
      console.error('Edit verify load error:', err);
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
        text: err.response?.data?.message || err.message || 'Could not load verification',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allVerify.html';
      });
    } finally {
      hideLoader();
      lucide.createIcons();
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!currentVerifyId) return;

    const formData = Object.fromEntries(new FormData(e.target));
    if (!['rejected', 'declined'].includes(formData.status)) {
      formData.rejectionReason = '';
    }

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn ? saveBtn.textContent : 'Update Status';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Updating...';
    }

    try {
      const res = await api.put(`/editVerify/${currentVerifyId}`, formData);
      const data = res.data;

      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to update verification');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: data.message || 'Verification updated successfully',
        timer: 2200,
        showConfirmButton: false
      });

      window.location.href = 'allVerify.html';
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Something went wrong while updating',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
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

    document.getElementById('status')?.addEventListener('change', function () {
      toggleRejectionReason(this.value);
    });

    document.getElementById('editVerifyForm')?.addEventListener('submit', handleSave);

    loadEditVerify();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();