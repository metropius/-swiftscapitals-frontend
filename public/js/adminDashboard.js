(function () {
  const LIMIT = 50;
  let currentPage = 1;
  let currentStatus = 'all';
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

  function renderUsersTable(users, page) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users || users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-gray-500">
            No users found
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    const rows = users
      .map((user, index) => {
        const sn = index + 1 + (page - 1) * LIMIT;
        const fullName = escapeHtml(
          `${user.firstname || ''} ${user.lastname || ''}`.replace(/\s+/g, ' ').trim() || '—'
        );
        const email = escapeHtml(user.email || '—');
        const country = escapeHtml(user.country || '—');
        const phone = escapeHtml(user.phone || '—');
        const isSuspended = !!user.isSuspended;
        const statusClass = isSuspended
          ? 'bg-red-100 text-red-800'
          : 'bg-green-100 text-green-800';
        const statusLabel = isSuspended ? 'Suspended' : 'Active';
        const suspendIcon = isSuspended ? 'play' : 'pause';
        const suspendTitle = isSuspended ? 'Unsuspend' : 'Suspend';
        const id = escapeHtml(user._id);

        return `
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${sn}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">${fullName}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${country}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${phone}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusClass}">
                ${statusLabel}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex items-center space-x-3">
                <a href="viewUser.html?id=${id}" class="text-blue-600 hover:text-blue-800" title="View">
                  <i data-lucide="eye" class="w-5 h-5"></i>
                </a>
                <a href="editUser.html?id=${id}" class="text-amber-600 hover:text-amber-800" title="Edit">
                  <i data-lucide="edit-2" class="w-5 h-5"></i>
                </a>
                <button
                  type="button"
                  data-id="${id}"
                  data-current="${isSuspended ? 'true' : 'false'}"
                  class="text-purple-600 hover:text-purple-800 toggle-suspend-btn"
                  title="${suspendTitle}">
                  <i data-lucide="${suspendIcon}" class="w-5 h-5"></i>
                </button>
                <button
                  type="button"
                  data-id="${id}"
                  data-name="${fullName}"
                  class="text-red-600 hover:text-red-800 delete-btn"
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
    bindActionButtons();
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

  async function loadDashboard() {
    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get('/adminiRoute', {
        params: {
          status: currentStatus,
          page: currentPage
        }
      });

      const data = res.data;

      if (!data || data.success === false) {
        throw new Error(data?.message || 'Failed to load admin dashboard');
      }

      const adminUser = data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      const users = data.users || [];
      const page = Number(data.page) || currentPage;
      const total = Number(data.totalPages) || 1;

      currentPage = page;
      totalPages = total;

      renderUsersTable(users, page);
      updatePagination(page, total);

      const filter = document.getElementById('statusFilter');
      if (filter && data.status) {
        filter.value = data.status;
        currentStatus = data.status;
      }
    } catch (err) {
      console.error('Admin dashboard load error:', err);
      if (err.response?.status === 401) {
        if (typeof logout === 'function') logout();
        else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = 'login.html';
        }
        return;
      }

      const tbody = document.getElementById('usersTableBody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-red-500">
              ${escapeHtml(err.response?.data?.message || err.message || 'Failed to load users')}
            </td>
          </tr>
        `;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Failed to load users',
        confirmButtonColor: '#0ea5e9'
      });
    } finally {
      hideLoader();
      lucide.createIcons();
    }
  }

  function bindActionButtons() {
    document.querySelectorAll('.toggle-suspend-btn').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const current = btn.dataset.current === 'true';
        const actionText = current ? 'reactivate' : 'suspend';

        const result = await Swal.fire({
          title: 'Are you sure?',
          text: `Do you want to ${actionText} this user?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: current ? '#10b981' : '#ef4444',
          cancelButtonColor: '#6b7280',
          confirmButtonText: `Yes, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`
        });

        if (!result.isConfirmed) return;

        try {
          const res = await api.put(`/suspendUser/${id}`);
          const data = res.data;

          if (!data || !data.success) {
            throw new Error(data?.message || 'Failed to update suspension status');
          }

          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: data.message || `User has been ${actionText}ed`,
            timer: 2000,
            showConfirmButton: false
          });

          loadDashboard();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.response?.data?.message || err.message || 'Something went wrong',
            confirmButtonColor: '#ef4444'
          });
        }
      };
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name || 'this user';

        const result = await Swal.fire({
          title: 'Delete User?',
          text: `Are you sure you want to permanently delete ${name}?`,
          icon: 'error',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Yes, Delete'
        });

        if (!result.isConfirmed) return;

        try {
          const res = await api.delete(`/deleteUser/${id}`);
          const data = res.data;

          if (!data || !data.success) {
            throw new Error(data?.message || 'Failed to delete user');
          }

          await Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: data.message || 'User has been deleted',
            timer: 2000,
            showConfirmButton: false
          });

          loadDashboard();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.response?.data?.message || err.message || 'Failed to delete user',
            confirmButtonColor: '#ef4444'
          });
        }
      };
    });
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
    currentStatus = params.get('status') || 'all';
    currentPage = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

    const filter = document.getElementById('statusFilter');
    if (filter) {
      filter.value = currentStatus;
      filter.addEventListener('change', (e) => {
        currentStatus = e.target.value;
        currentPage = 1;
        const url = new URL(window.location.href);
        url.searchParams.set('status', currentStatus);
        url.searchParams.set('page', '1');
        window.history.replaceState({}, '', url);
        loadDashboard();
      });
    }

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(currentPage));
      url.searchParams.set('status', currentStatus);
      window.history.replaceState({}, '', url);
      loadDashboard();
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
      if (currentPage >= totalPages) return;
      currentPage += 1;
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(currentPage));
      url.searchParams.set('status', currentStatus);
      window.history.replaceState({}, '', url);
      loadDashboard();
    });

    loadDashboard();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();