const state = {
  page: 'parent',
  student: null,
  pendingBill: null,
  adminLoggedIn: false,
  adminTab: 'students'
};

const ADMIN_PASSWORD = 'zool123';

function navigate(page) {
  state.page = page;
  render();
}

function render() {
  document.getElementById('parent-portal').classList.add('hidden');
  document.getElementById('admin-portal').classList.add('hidden');
  document.getElementById('nav-parent').classList.remove('bg-white', 'text-emerald-700');
  document.getElementById('nav-admin').classList.remove('bg-white', 'text-emerald-700');

  if (state.page === 'parent') {
    document.getElementById('parent-portal').classList.remove('hidden');
    document.getElementById('nav-parent').classList.add('bg-white', 'text-emerald-700');
  } else if (state.page === 'admin') {
    document.getElementById('admin-portal').classList.remove('hidden');
    document.getElementById('nav-admin').classList.add('bg-white', 'text-emerald-700');
    renderAdmin();
  }
}

function renderAdmin() {
  const loginEl = document.getElementById('admin-login');
  const dashboardEl = document.getElementById('admin-dashboard');
  if (!loginEl || !dashboardEl) return;

  if (state.adminLoggedIn) {
    loginEl.classList.add('hidden');
    dashboardEl.classList.remove('hidden');
    setAdminTab(state.adminTab);
    loadAdminData();
  } else {
    loginEl.classList.remove('hidden');
    dashboardEl.classList.add('hidden');
  }
}

function loginAdmin() {
  const input = document.getElementById('admin-password');
  const msg = document.getElementById('login-msg');
  if (input.value === ADMIN_PASSWORD) {
    state.adminLoggedIn = true;
    msg.classList.add('hidden');
    input.value = '';
    renderAdmin();
  } else {
    msg.classList.remove('hidden');
  }
}

function logoutAdmin() {
  state.adminLoggedIn = false;
  renderAdmin();
}

function setAdminTab(tab) {
  state.adminTab = tab;
  document.querySelectorAll('.admin-panel').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.admin-tab').forEach(el => {
    el.classList.remove('bg-emerald-700', 'text-white');
    el.classList.add('bg-slate-100', 'text-slate-700');
  });
  const panel = document.getElementById('admin-' + tab);
  const tabBtn = document.getElementById('tab-' + tab);
  if (panel) panel.classList.remove('hidden');
  if (tabBtn) {
    tabBtn.classList.remove('bg-slate-100', 'text-slate-700');
    tabBtn.classList.add('bg-emerald-700', 'text-white');
  }
  if (tab === 'packages') renderPackagesEditor();
  if (tab === 'payments') loadPaymentTracker();
}

// Simple router from URL ?page=...
const urlParams = new URLSearchParams(window.location.search);
const pageParam = urlParams.get('page');
if (pageParam === 'payment-success') {
  state.page = 'parent';
  setTimeout(() => showReceiptUpload(urlParams.get('bill')), 100);
}

render();
