document.addEventListener('DOMContentLoaded', async () => {
  requireAuthPage();

  try {
    const res = await api.get('/dashboard');
    const data = res.data;

    if (!data.success) {
      throw new Error(data.message || 'Failed to load dashboard');
    }

    const { user, wallet, monthlyIncome, monthlyOutgoing, pendingTransactions, transactionVolume, accountAge, recentTransactions } = data;

    // Store user for other pages
    localStorage.setItem('user', JSON.stringify(user));

    // ========== USER INFO ==========
    const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
    const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

    // Sidebar
    document.getElementById('sidebar-user-name').textContent = fullName;
    document.getElementById('sidebar-user-id').textContent = `ID: ${user._id}`;
    document.getElementById('sidebar-user-image').src = avatarUrl;
    document.getElementById('sidebar-user-image').alt = fullName;

    // Header
    document.getElementById('header-user-image').src = avatarUrl;
    document.getElementById('header-user-image').alt = fullName;
    document.getElementById('dropdown-user-name').textContent = fullName;
    document.getElementById('dropdown-user-id').textContent = `ID: ${user._id}`;

    // Mobile
    document.getElementById('mobile-user-name').textContent = fullName;
    document.getElementById('mobile-user-account').textContent = `Account: ${user.account_no || user._id}`;
    document.getElementById('mobile-user-image').src = avatarUrl;

    // Balance card
    document.getElementById('balance-card-user-name').textContent = fullName;
    document.getElementById('balance-card-user-image').src = avatarUrl;

    // ========== BALANCES ==========
    const currency = user.currency || '$';
    const balance = user.balance || '0.00';
    const btcBalance = (user.btcBalance || 0).toFixed(6);

    document.getElementById('main-balance').textContent = `${currency}${balance}`;
    document.getElementById('header-balance-usd').textContent = `${currency}${balance}`;
    document.getElementById('header-balance-btc').textContent = `₿ ${btcBalance}`;
    document.getElementById('stat-balance-usd').textContent = `${currency}${balance}`;
    document.getElementById('stat-balance-btc').textContent = `₿ ${btcBalance}`;

    // ========== STATS ==========
    document.getElementById('stat-monthly-income').textContent = monthlyIncome;
    document.getElementById('stat-monthly-outgoing').textContent = monthlyOutgoing;
    document.getElementById('stat-limit').textContent = `${currency}${user.limit || '0.00'}`;
    document.getElementById('stat-limit-right').textContent = `${currency}${user.limit || '0.00'}`;
    document.getElementById('stat-pending').textContent = `${currency}${pendingTransactions}`;
    document.getElementById('stat-volume').textContent = `${currency}${transactionVolume}`;
    document.getElementById('stat-age').textContent = accountAge;

    // Account numbers
    document.getElementById('mobile-account-no').textContent = user.account_no || '—';
    document.getElementById('desktop-account-no').textContent = user.account_no || '—';

    // ========== DYNAMIC LINKS ==========
    const userId = user._id;
    document.getElementById('link-transactions').href = `accounthistory.html?id=${userId}`;
    document.getElementById('link-loan-history').href = `viewloan.html?id=${userId}`;
    document.getElementById('link-swap').href = `swap.html?id=${userId}`;
    document.getElementById('mobile-link-transactions').href = `accounthistory.html?id=${userId}`;
    document.getElementById('mobile-link-transactions-2').href = `accounthistory.html?id=${userId}`;
    document.getElementById('mobile-bottom-transactions').href = `accounthistory.html?id=${userId}`;
    document.getElementById('desktop-link-transactions').href = `accounthistory.html?id=${userId}`;
    document.getElementById('quick-link-history').href = `accounthistory.html?id=${userId}`;
    document.getElementById('recent-view-all').href = `accounthistory.html?id=${userId}`;

    // ========== RECENT TRANSACTIONS ==========
    const tbody = document.getElementById('recent-transactions-body');
    if (recentTransactions && recentTransactions.length > 0) {
      tbody.innerHTML = recentTransactions.map(tx => `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="h-10 w-10 rounded-full flex items-center justify-center ${tx.color === 'green' ? 'bg-green-100' : 'bg-red-100'}">
              <i data-lucide="${tx.icon}" class="h-5 w-5 ${tx.color === 'green' ? 'text-green-600' : 'text-red-600'}"></i>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">
              ${currency}${Number(tx.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.displayType === 'Credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              ${tx.displayType}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full
              ${tx.status === 'Approved' ? 'bg-green-100 text-green-800' :
                tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'}">
              ${tx.status}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
            ${tx.reference.substring(0, 8)}...
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${tx.createdAtFormatted}
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center text-gray-500">
            <i data-lucide="history" class="mx-auto h-12 w-12 text-gray-400"></i>
            <p class="mt-2 text-sm">No recent transactions</p>
          </td>
        </tr>
      `;
    }

    // ========== WALLET DETAILS (Bank Account Modal) ==========
    const walletList = document.getElementById('wallet-details-list');
    walletList.innerHTML = `
      <li class="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <div class="flex items-center">
          <div class="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
          <span class="text-sm text-gray-700">Bank Name</span>
        </div>
        <div class="flex items-center">
          <span class="text-sm font-medium">${wallet.bank_name || '—'}</span>
          <button class="ml-2 text-primary-500 hover:text-primary-700 focus:outline-none" onclick="navigator.clipboard.writeText('${wallet.bank_name || ''}')">
            <i data-lucide="copy" class="h-4 w-4"></i>
          </button>
        </div>
      </li>
      <li class="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <div class="flex items-center">
          <div class="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
          <span class="text-sm text-gray-700">Account Name</span>
        </div>
        <div class="flex items-center">
          <span class="text-sm font-medium">${wallet.account_name || '—'}</span>
          <button class="ml-2 text-primary-500 hover:text-primary-700 focus:outline-none" onclick="navigator.clipboard.writeText('${wallet.account_name || ''}')">
            <i data-lucide="copy" class="h-4 w-4"></i>
          </button>
        </div>
      </li>
      <li class="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <div class="flex items-center">
          <div class="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
          <span class="text-sm text-gray-700">Account Number</span>
        </div>
        <div class="flex items-center">
          <span class="text-sm font-medium">${wallet.account_no || '—'}</span>
          <button class="ml-2 text-primary-500 hover:text-primary-700 focus:outline-none" onclick="navigator.clipboard.writeText('${wallet.account_no || ''}')">
            <i data-lucide="copy" class="h-4 w-4"></i>
          </button>
        </div>
      </li>
      <li class="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <div class="flex items-center">
          <div class="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
          <span class="text-sm text-gray-700">Sort Code</span>
        </div>
        <div class="flex items-center">
          <span class="text-sm font-medium">${wallet.sortcode || '—'}</span>
          <button class="ml-2 text-primary-500 hover:text-primary-700 focus:outline-none" onclick="navigator.clipboard.writeText('${wallet.sortcode || ''}')">
            <i data-lucide="copy" class="h-4 w-4"></i>
          </button>
        </div>
      </li>
      <li class="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <div class="flex items-center">
          <div class="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
          <span class="text-sm text-gray-700">SWIFT Code</span>
        </div>
        <div class="flex items-center">
          <span class="text-sm font-medium">${wallet.swift_code || '—'}</span>
          <button class="ml-2 text-primary-500 hover:text-primary-700 focus:outline-none" onclick="navigator.clipboard.writeText('${wallet.swift_code || ''}')">
            <i data-lucide="copy" class="h-4 w-4"></i>
          </button>
        </div>
      </li>
    `;

    // Re-create Lucide icons after injecting HTML
    lucide.createIcons();

  } catch (err) {
    console.error('Dashboard load error:', err);
    if (err.response?.status === 401) {
      logout();
    } else {
      alert('Failed to load dashboard. Please refresh the page.');
    }
  }
});