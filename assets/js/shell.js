
window.PortalShell = (() => {
  const navItems = [
    ["dashboard","Dashboard"],["my-tasks","My Tasks"],["department-tasks","Team / Department Tasks"],
    ["assign-task","Assign Task"],["templates","Task Templates"],["recurring","Recurring Tasks"],
    ["approvals","Approval Center"],["escalations","Escalation Center"],["notifications","Notifications Center"],
    ["activity-log","Activity / Audit Log"],["reports","Reports"],["personal-todo","Personal To-Do"],["handover","Handover Workflow"]
  ];

  function assetPrefix() {
    return location.pathname.includes("/pages/") ? "../assets" : "./assets";
  }

  function pagePrefix() {
    return location.pathname.includes("/pages/") ? "" : "./pages/";
  }

  function renderShell(activeKey, title, subtitle) {
    const current = window.Store?.currentUser || { full_name: "Taher Albaghli", role: "Head of Contact Center" };
    const prefix = assetPrefix();
    const pageP = pagePrefix();
    document.body.innerHTML = `
      <div class="portal-shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">K</div>
            <div>
              <h1>KIB Control Portal</h1>
              <p>Management • Tasks • Governance</p>
            </div>
          </div>
          <nav class="sidebar-nav">
            ${navItems.map(([key,label]) => `<a class="nav-link ${key===activeKey?"active":""}" href="${pageP}${key}.html">${label}</a>`).join("")}
          </nav>
        </aside>
        <div class="layout">
          <header class="topbar">
            <div>
              <div class="eyebrow">Contact Center Management Layer</div>
              <h2>${title}</h2>
              <p>${subtitle}</p>
            </div>
            <div class="topbar-actions">
              <input id="globalSearch" class="global-search" placeholder="Search tasks, users, templates..." />
              <button class="btn btn-soft" id="toggleModeBtn">${window.APP_CONFIG.sampleMode ? "Sample Mode" : "Live Mode"}</button>
              <div class="user-box">
                <div class="avatar">${(current.full_name||"TA").split(" ").map(x=>x[0]).slice(0,2).join("")}</div>
                <div>
                  <strong>${current.full_name}</strong>
                  <small>${current.role}</small>
                </div>
              </div>
            </div>
          </header>
          <main class="page-content" id="pageContent"></main>
        </div>
      </div>
      <div class="drawer" id="taskDrawer">
        <div class="drawer-card">
          <div class="drawer-header">
            <h3>Task Detail</h3>
            <button class="btn btn-soft" onclick="PortalUI.closeDrawer()">Close</button>
          </div>
          <div class="drawer-body" id="taskDrawerBody"></div>
        </div>
      </div>
      <div class="modal" id="actionModal"><div class="modal-card" id="actionModalBody"></div></div>
    `;
    document.getElementById("toggleModeBtn").onclick = () => {
      window.APP_CONFIG.sampleMode = !window.APP_CONFIG.sampleMode;
      location.reload();
    };
  }
  return { renderShell, assetPrefix, pagePrefix };
})();
