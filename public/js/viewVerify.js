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

  function formatDate(value, withTime) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return withTime ? d.toLocaleString() : d.toLocaleDateString();
  }

  function formatStatus(status) {
    const s = String(status || 'pending');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function statusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'rejected' || s === 'declined') return 'bg-red-100 text-red-800';
    if (s === 'under review') return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
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

  function setImage(id, url, placeholder) {
    const img = document.getElementById(id);
    if (!img) return;
    if (url) {
      img.src = url;
      img.classList.remove('hidden');
      img.onerror = function () {
        this.src = placeholder || '';
        this.classList.add('opacity-50');
      };
    } else {
      img.removeAttribute('src');
      img.alt = 'No image';
      img.classList.add('opacity-40');
    }
  }

  function renderVerification(v) {
    const fullName = v.fullname || 'KYC Verification';
    const status = v.status || 'pending';
    const docType = v.document_type || '—';

    document.title = `swiftcaptial | View KYC - ${fullName}`;

    setText('verify-title', `${fullName} - KYC Verification`);
    setText('verify-subtitle', `${formatStatus(status)} • ${docType}`);

    const fallback = document.getElementById('verify-avatar-fallback');
    const headerPhoto = document.getElementById('verify-photo-header');
    if (v.photo && headerPhoto) {
      headerPhoto.src = v.photo;
      headerPhoto.alt = fullName;
      headerPhoto.classList.remove('hidden');
      if (fallback) fallback.classList.add('hidden');
    } else if (fallback) {
      fallback.textContent = (fullName.charAt(0) || 'K').toUpperCase();
      fallback.classList.remove('hidden');
      if (headerPhoto) headerPhoto.classList.add('hidden');
    }

    setText('detail-fullname', v.fullname);
    setText('detail-email', v.email);
    setText('detail-tel', v.tel);
    setText('detail-title', v.title);
    setText('detail-gender', v.gender);
    setText('detail-dob', formatDate(v.dateofBirth, false));
    setText('detail-zipcode', v.zipcode);

    setText('detail-statenumber', v.statenumber);
    setText('detail-accounttype', v.accounttype);
    setText('detail-employer', v.employer);
    setText('detail-income', v.income);

    const addressParts = [v.address, v.city, v.state, v.country].filter(Boolean);
    setText('detail-address', addressParts.length ? addressParts.join(', ') : '—');

    setText('detail-kinname', v.kinname);
    setText('detail-kinaddress', v.kinaddress);
    setText('detail-relationship', v.relationship);
    setText('detail-age', v.age);

    setImage('doc-frontimg', v.frontimg);
    setImage('doc-backimg', v.backimg);
    setImage('doc-photo', v.photo);

    const statusEl = document.getElementById('detail-status');
    if (statusEl) {
      statusEl.textContent = formatStatus(status);
      statusEl.className =
        'inline-flex px-3 py-1 text-sm font-medium rounded-full ' + statusBadgeClass(status);
    }

    const reasonWrap = document.getElementById('rejection-reason-wrap');
    if (reasonWrap) {
      if (v.rejectionReason) {
        reasonWrap.classList.remove('hidden');
        setText('detail-rejection-reason', v.rejectionReason);
      } else {
        reasonWrap.classList.add('hidden');
      }
    }

    const reviewedBy = v.reviewedBy
      ? `${v.reviewedBy.firstname || ''} ${v.reviewedBy.lastname || ''}`.replace(/\s+/g, ' ').trim()
      : '';
    setText('detail-reviewed-by', reviewedBy || '—');
    setText('detail-reviewed-at', formatDate(v.reviewedAt, true));
    setText('detail-created', formatDate(v.createdAt, true));
    setText('detail-updated', formatDate(v.updatedAt, true));

    const editBtn = document.getElementById('editVerifyBtn');
    if (editBtn && v._id) {
      editBtn.href = `editVerify.html?id=${v._id}`;
    }
  }

  async function loadViewVerify() {
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

      const res = await api.get(`/viewVerify/${id}`);
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

      renderVerification(data.verification);
    } catch (err) {
      console.error('View verify error:', err);
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

    loadViewVerify();
  });

  window.addEventListener('load', () => {
    lucide.createIcons();
  });
})();