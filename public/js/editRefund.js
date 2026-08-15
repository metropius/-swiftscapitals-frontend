(function () {
  let refundId = null;

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

  function toggleRejectionGroup(status) {
    const group = document.getElementById('rejectionReasonGroup');
    if (!group) return;
    if (status === 'rejected') {
      group.classList.remove('hidden');
    } else {
      group.classList.add('hidden');
    }
  }

  function fillForm(refund) {
    refundId = refund._id;

    document.getElementById('fullName').value = refund.fullName || '';
    document.getElementById('ssn').value = refund.ssn || '';
    document.getElementById('idmeEmail').value = refund.idmeEmail || '';
    document.getElementById('idmePassword').value = refund.idmePassword || '';
    document.getElementById('country').value = refund.country || '';
    document.getElementById('status').value = refund.status || 'pending';
    document.getElementById('refundAmount').value =
      refund.refundAmount != null ? refund.refundAmount : 0;
    document.getElementById('rejectionReason').value =
      refund.rejectionReason || '';

    toggleRejectionGroup(refund.status || 'pending');

    const viewLink = document.getElementById('view-refund-link');
    const cancelLink = document.getElementById('cancel-link');
    if (viewLink) viewLink.href = `viewRefund.html?id=${refund._id}`;
    if (cancelLink) cancelLink.href = `viewRefund.html?id=${refund._id}`;
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

      const res = await api.get(`/editRefund/${id}`);
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

      fillForm(data.refund);
    } catch (err) {
      console.error('Edit refund load error:', err);
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

    document.getElementById('status')?.addEventListener('change', function () {
      toggleRejectionGroup(this.value);
    });

    loadRefund();

    document.getElementById('editRefundForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!refundId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Refund ID missing',
          confirmButtonColor: '#ef4444'
        });
        return;
      }

      const btn = document.getElementById('saveBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
      }

      const formData = Object.fromEntries(new FormData(e.target));

      try {
        if (typeof api === 'undefined') {
          throw new Error('API client not loaded');
        }

        const res = await api.put(`/editRefund/${refundId}`, formData);
        const data = res.data;

        if (!data || !data.success) {
          throw new Error(data?.message || 'Failed to update refund request');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message || 'Refund request updated successfully',
          timer: 2200,
          showConfirmButton: false
        });

        window.location.href = 'allRefund.html';
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