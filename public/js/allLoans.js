(function () {
  const LIMIT = 50;
  let currentPage = 1;
  let totalPages = 1;

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

  function statusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  }

  function renderLoansTable(loans, page) {
    const tbody = document.getElementById('loansTableBody');
    if (!tbody) return;

    if (!loans || loans.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-gray-500">
            No loans found
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    const rows = loans
      .map((loan, index) => {
        const sn = index + 1 + (page - 1) * LIMIT;
        const amount = escapeHtml(loan.loan_amount != null ? String(loan.loan_amount) : '—');
        const category = escapeHtml(loan.loan_category || '—');
        const duration = escapeHtml(loan.loan_duration || '—');
        const statusRaw = loan.status || 'pending';
        const statusLabel = escapeHtml(
          statusRaw.charAt(0).toUpperCase() + String(statusRaw).slice(1)
        );
        const ownerName = loan.owner
          ? escapeHtml(
              `${loan.owner.firstname || ''} ${loan.owner.lastname || ''}`.replace(/\s+/g, ' ').trim() || '—'
            )
          : '—';
        const dateStr = loan.createdAt
          ? escapeHtml(new Date(loan.createdAt).toLocaleDateString())
          : '—';
        const id = escapeHtml(loan._id);

        return `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${sn}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${amount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${duration}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge(statusRaw)}">
                ${statusLabel}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${ownerName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${dateStr}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex items-center space-x-4">
                <a href="viewLoans.html?id=${id}" class="text-blue-600 hover:text-blue-800" title="View">
                  <i data-lucide="eye" class="w-5 h-5"></i>
                </a>
                <a href="editLoan.html?id=${id}" class="text-amber-600 hover:text-amber-800" title="Edit">
                  <i data-lucide="edit-2" class="w-5 h-5"></i>
                </a>
                <button
                  type="button"
                  data-id="${id}"
                  class="text-red-600 hover:text-red-800 delete-loan-btn"
                  title="Delete">
                  <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.innerHTML = rows;
    lucide.createIcons();
    bindDeleteButtons();
  }

  function updatePagination(page, total) {
    totalPages = total || 1;
    currentPage = page || 1;

    const container = document.getElementById('paginationContainer');
    const info = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (!container) return;

    if (totalPages <= 1) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    if (info) info.textContent = `Showing page ${currentPage} of ${totalPages}`;

    if (prevBtn) {
      prevBtn.disabled = currentPage <= 1;
      prevBtn.classList.toggle('opacity-50', currentPage <= 1);
      prevBtn.classList.toggle('cursor-not-allowed', currentPage <= 1);
    }
    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.classList.toggle('opacity-50', currentPage >= totalPages);
      nextBtn.classList.toggle('cursor-not-allowed', currentPage >= totalPages);
    }
  }

  function bindDeleteButtons() {
    document.querySelectorAll('.delete-loan-btn').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;

        const result = await Swal.fire({
          title: 'Delete Loan?',
          text: 'This action cannot be undone!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Yes, Delete'
        });

        if (!result.isConfirmed) return;

        try {
          if (typeof api === 'undefined') throw new Error('API client not loaded');

          const res = await api.delete(`/deleteLoan/${id}`);
          const data = res.data;

          if (!data || !data.success) {
            throw new Error(data?.message || 'Failed to delete loan');
          }

          await Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: data.message || 'Loan deleted successfully',
            timer: 2000,
            showConfirmButton: false
          });

          loadLoans();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.response?.data?.message || err.message || 'Failed to delete loan',
            confirmButtonColor: '#ef4444'
          });
        }
      };
    });
  }

  async function loadLoans() {
    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get('/allLoans', {
        params: { page: currentPage }
      });

      const data = res.data;

      if (!data || data.success === false) {
        throw new Error(data?.message || 'Failed to load loans');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      const loans = data.loans || [];
      const page = Number(data.page) || currentPage;
      const total = Number(data.totalPages) || 1;

      currentPage = page;
      totalPages = total;

      renderLoansTable(loans, page);
      updatePagination(page, total);
    } catch (err) {
      console.error('All loans load error:', err);
      if (err.response?.status === 401) {
        if (typeof logout === 'function') logout();
        else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'login.html';
        }
        return;
      }

      const tbody = document.getElementById('loansTableBody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="px-6 py-12 text-center text-red-500">
              ${escapeHtml(err.response?.data?.message || err.message || 'Failed to load loans')}
            </td>
          </tr>
        `;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to load loans',
        confirmButtonColor: '#0ea5e9'
      });
    } finally {
      hideLoader();
      lucide.createIcons();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (typeof requireAuthPage === 'function') {
      requireAuthPage();
    } else if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    } else if (!localStorage.getItem('token')) {
      window.location.href = 'login.html';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    currentPage = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(currentPage));
      window.history.replaceState({}, '', url);
      loadLoans();
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
      if (currentPage >= totalPages) return;
      currentPage += 1;
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(currentPage));
      window.history.replaceState({}, '', url);
      loadLoans();
    });

    loadLoans();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();