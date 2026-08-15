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

  function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function formatStatus(status) {
    const s = String(status || 'pending');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function statusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'resolved') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
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

  function renderTicket(ticket) {
    const subject = ticket.subject || 'No Subject';
    const status = ticket.status || 'pending';
    const priority = ticket.priority || '—';

    document.title = `swiftcaptial | View Ticket - ${subject}`;

    setText('ticket-subject-title', subject);
    setText('ticket-subtitle', `${formatStatus(status)} • Priority: ${priority}`);

    const avatar = document.getElementById('ticket-avatar');
    if (avatar) avatar.textContent = (subject.charAt(0) || 'T').toUpperCase();

    setText('detail-subject', ticket.subject || '—');
    setText('detail-name', ticket.name || '—');
    setText('detail-email', ticket.email || '—');
    setText('detail-priority', priority);

    const statusEl = document.getElementById('detail-status');
    if (statusEl) {
      statusEl.textContent = formatStatus(status);
      statusEl.className =
        'inline-flex px-3 py-1 text-sm font-medium rounded-full ' + statusBadgeClass(status);
    }

    setText('detail-message', ticket.message || 'No message provided');

    const img = document.getElementById('ticket-image');
    const noImg = document.getElementById('ticket-no-image');
    if (ticket.image && img) {
      img.src = ticket.image;
      img.classList.remove('hidden');
      if (noImg) noImg.classList.add('hidden');
      img.onerror = function () {
        this.classList.add('hidden');
        if (noImg) {
          noImg.textContent = 'Image failed to load';
          noImg.classList.remove('hidden');
        }
      };
    } else {
      if (img) img.classList.add('hidden');
      if (noImg) {
        noImg.textContent = 'No image attached';
        noImg.classList.remove('hidden');
      }
    }

    const owner = ticket.owner || {};
    const ownerName =
      `${owner.firstname || ''} ${owner.lastname || ''}`.replace(/\s+/g, ' ').trim() || '—';
    setText('owner-name', ownerName);
    setText('owner-email', owner.email || '—');
    setText('owner-phone', owner.phone || '—');
    setText('owner-country', owner.country || '—');

    setText('detail-created', formatDate(ticket.createdAt));
    setText('detail-updated', formatDate(ticket.updatedAt));
  }

  async function loadViewTicket() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No ticket ID provided.',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allTickets.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/viewTickets/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.ticket) {
        throw new Error(data?.message || 'Ticket not found');
      }

      if (data.admin || data.currentUser) {
        const adminUser = data.admin || data.currentUser;
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      } else if (typeof getCurrentUser === 'function') {
        populateAdminUI(getCurrentUser());
      }

      renderTicket(data.ticket);
    } catch (err) {
      console.error('View ticket error:', err);
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
        text: err.response?.data?.message || err.message || 'Could not load ticket',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'allTickets.html';
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

    loadViewTicket();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();