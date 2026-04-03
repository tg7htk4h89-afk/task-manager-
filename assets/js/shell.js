window.PortalShell = (() => {
  function assetPrefix() {
    return location.pathname.includes('/pages/') ? '../assets' : './assets';
  }

  function pagePrefix() {
    return location.pathname.includes('/pages/') ? '' : './pages/';
  }

  function initials(name = '') {
    return String(name).split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }

  function renderShell(activeKey, title, subtitle) {
    const user = window.Store.currentUser;
    const nav = window.APP_CONFIG.pages.map(([key, label]) => `
      <a class="nav-link ${key === activeKey ? 'active' : ''}" href="${pagePrefix()}${key}.html">${label}</a>
    `).join('');

    document.body.innerHTML = `
      <div class="mobile-topbar">
        <button class="icon-btn" id="menuToggle" aria-label="Open menu">☰</button>
        <div class="mobile-brand">${window.APP_CONFIG.appName}</div>
        <button class="icon-btn" id="mobileLogout" aria-label="Logout">⎋</button>
      </div>
      <div class="app-shell">
        <aside class="sidebar" id="sidebar">
          <div class="brand-panel">
            <div class="brand-mark">K</div>
            <div>
              <div class="brand-title">KIB Control Portal</div>
              <div class="brand-subtitle">Management • Tasks • Governance</div>
            </div>
          </div>
          <div class="sidebar-section-label">Workspace</div>
          <nav class="nav-list">${nav}</nav>
          <div class="sidebar-footer">
            <div class="user-summary">
              <div class="user-avatar">${initials(user.full_name)}</div>
              <div>
                <strong>${user.full_name}</strong>
                <small>${user.role}</small>
              </div>
            </div>
            <button class="btn btn-outline btn-block" id="sidebarLogout">Sign out</button>
          </div>
        </aside>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <div class="workspace">
          <header class="hero-bar">
            <div>
              <div class="eyebrow">Contact Center Management Layer</div>
              <h1>${title}</h1>
              <p>${subtitle}</p>
            </div>
            <div class="hero-tools">
              <div class="search-wrap"><input id="globalSearch" type="search" placeholder="Search tasks, users, templates..." /></div>
              <div class="user-chip">
                <div class="user-avatar user-avatar--dark">${initials(user.full_name)}</div>
                <div>
                  <strong>${user.full_name}</strong>
                  <small>${user.role}</small>
                </div>
              </div>
            </div>
          </header>
          <main id="pageContent" class="page-content"></main>
        </div>
      </div>
      <div class="drawer" id="taskDrawer">
        <div class="drawer-card">
          <div class="drawer-head">
            <div>
              <div class="eyebrow">Task Detail</div>
              <h3 id="drawerTitle">Task</h3>
            </div>
            <button class="icon-btn" id="drawerClose">✕</button>
          </div>
          <div class="drawer-body" id="taskDrawerBody"></div>
        </div>
      </div>
      <div class="modal" id="actionModal">
        <div class="modal-card" id="actionModalCard">
          <div class="modal-head"><h3 id="modalTitle">Action</h3><button class="icon-btn" id="modalClose">✕</button></div>
          <div id="actionModalBody"></div>
        </div>
      </div>
      <div class="toast-wrap" id="toastWrap"></div>
    `;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    document.getElementById('menuToggle').onclick = () => {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    };
    overlay.onclick = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    };
    document.getElementById('drawerClose').onclick = () => PortalUI.closeDrawer();
    document.getElementById('modalClose').onclick = () => PortalUI.closeModal();
    document.getElementById('actionModal').addEventListener('click', (e) => {
      if (e.target.id === 'actionModal') PortalUI.closeModal();
    });
    document.getElementById('sidebarLogout').onclick = () => PortalActions.logout();
    document.getElementById('mobileLogout').onclick = () => PortalActions.logout();
  }

  return { renderShell, assetPrefix, pagePrefix };
})();
