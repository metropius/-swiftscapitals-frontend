(function () {
  let loanId = null;

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

  function fillForm(loan) {
    loanId = loan._id;

    document.getElementById('loan_amount').value = loan.loan_amount || '';
    document.getElementById('loan_category').value = loan.loan_category || '';
    document.getElementById('loan_duration').value = loan.loan_duration || '';
    document.getElementById('loan_income').value = loan.loan_income || '';
    document.getElementById('loan_reason').value = loan.loan_reason || '';
    document.getElementById('status').value = loan.status || 'pending';

    const viewLink = document.getElementById('view-loan-link');
    const cancelLink = document.getElementById('cancel-link');
    if (viewLink) viewLink.href = `viewLoans.html?id=${loan._id}`;
    if (cancelLink) cancelLink.href = `viewLoans.html?id=${loan._id}`;
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

      const res = await api.get(`/editLoan/${id}`);
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

      fillForm(data.loan);
    } catch (err) {
      console.error('Edit loan load error:', err);
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

    document.getElementById('editLoanForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!loanId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Loan ID missing',
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

        const res = await api.put(`/editLoan/${loanId}`, formData);
        const data = res.data;

        if (!data || !data.success) {
          throw new Error(data?.message || 'Failed to update loan');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message || 'Loan updated successfully',
          timer: 2200,
          showConfirmButton: false
        });

        window.location.href = 'allLoans.html';
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