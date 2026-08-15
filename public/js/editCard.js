(function () {
  let cardId = null;

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

  function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (!el || value == null || value === '') return;
    el.value = value;
  }

  function fillForm(card) {
    cardId = card._id;

    setSelectValue('cardType', card.cardType);
    setSelectValue('cardLevel', card.cardLevel);
    document.getElementById('cardNumber').value = card.cardNumber || '';
    document.getElementById('expiryDate').value = card.expiryDate || '';
    document.getElementById('cvv').value = card.cvv || '';
    document.getElementById('cardHolderName').value = card.cardHolderName || '';
    setSelectValue('currency', card.currency || 'USD');
    document.getElementById('balance').value =
      card.balance != null ? card.balance : 0;
    document.getElementById('dailyLimit').value =
      card.dailyLimit != null ? card.dailyLimit : 1000;
    setSelectValue('status', card.status || 'pending');
    document.getElementById('rejectionReason').value = card.rejectionReason || '';

    const viewLink = document.getElementById('view-card-link');
    const cancelLink = document.getElementById('cancel-link');
    if (viewLink) viewLink.href = `viewCard.html?id=${card._id}`;
    if (cancelLink) cancelLink.href = `viewCard.html?id=${card._id}`;
  }

  async function loadCard() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      Swal.fire({
        icon: 'error',
        title: 'Missing ID',
        text: 'No card ID provided',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'all-cards.html';
      });
      return;
    }

    try {
      if (typeof api === 'undefined') {
        throw new Error('API client not loaded. Check config.js');
      }

      const res = await api.get(`/editCard/${id}`);
      const data = res.data;

      if (!data || data.success === false || !data.card) {
        throw new Error(data?.message || 'Card not found');
      }

      const adminUser =
        data.admin || data.user || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
      if (adminUser) {
        localStorage.setItem('user', JSON.stringify(adminUser));
        populateAdminUI(adminUser);
      }

      fillForm(data.card);
    } catch (err) {
      console.error('Edit card load error:', err);
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
        text: err.response?.data?.message || err.message || 'Failed to load card',
        confirmButtonColor: '#0ea5e9'
      }).then(() => {
        window.location.href = 'all-cards.html';
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

    loadCard();

    document.getElementById('editCardForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!cardId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Card ID missing',
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

        const res = await api.put(`/editCard/${cardId}`, formData);
        const data = res.data;

        if (!data || !data.success) {
          throw new Error(data?.message || 'Failed to update card');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message || 'Card updated successfully',
          timer: 2200,
          showConfirmButton: false
        });

        window.location.href = 'all-cards.html';
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