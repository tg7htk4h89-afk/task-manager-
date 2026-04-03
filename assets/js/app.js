
window.Store = {
  raw: null,
  currentUser: null,
  async init() {
    const dataUrl = (location.pathname.includes("/pages/") ? "../assets/data/sample-data.json" : "./assets/data/sample-data.json");
    const data = await fetch(dataUrl).then(r=>r.json());
    this.raw = data;
    this.currentUser = data.users.find(u => u.user_id === window.APP_CONFIG.defaultUserId) || data.users[0];
    return this;
  },
  users() { return this.raw.users; },
  templates() { return this.raw.templates; },
  tasks() { return this.raw.tasks; },
  approvals() { return this.raw.approvals; },
  notifications() { return this.raw.notifications; },
  activity() { return this.raw.activity; },
  todos() { return this.raw.todos; },
  handovers() { return this.raw.handovers; },
  myTasks() { return this.raw.tasks.filter(t => t.assigned_to_user_id === this.currentUser.user_id); },
  departmentTasks() { return this.raw.tasks.filter(t => t.department === this.currentUser.department); },
  stats() {
    const tasks = this.departmentTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => ["Completed","Closed"].includes(t.status)).length;
    const open = tasks.filter(t => !["Completed","Closed"].includes(t.status)).length;
    const overdue = tasks.filter(t => ["Overdue","Escalated"].includes(t.status)).length;
    const escalated = tasks.filter(t => t.status === "Escalated").length;
    const delayed = tasks.filter(t => t.delay_requested || t.status === "Deferred Requested").length;
    const delegated = tasks.filter(t => t.status === "Delegated").length;
    const approvalsPending = this.approvals().filter(a => a.approval_status === "Pending").length;
    return {
      total, completed, open, overdue, escalated, delayed, delegated, approvalsPending,
      completionRate: total ? Math.round((completed/total)*100) : 0
    };
  }
};

window.PortalUI = {
  badge(text, type="status") {
    const cls = String(text).toLowerCase().replace(/\s+/g,"-");
    return `<span class="badge ${type}-${cls}">${text}</span>`;
  },
  formatDate(v) {
    if (!v) return "-";
    return String(v).replace("T"," ").slice(0,16);
  },
  metricCard(label, value, sub="") {
    return `<section class="metric-card"><span>${label}</span><strong>${value}</strong><small>${sub||""}</small></section>`;
  },
  table(headers, rowsHtml) {
    return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
  },
  openDrawer(taskId) {
    const task = Store.tasks().find(t => t.task_id === taskId);
    if (!task) return;
    const body = document.getElementById("taskDrawerBody");
    body.innerHTML = `
      <div class="detail-grid">
        <section class="detail-hero">
          <div class="chip-row">${this.badge(task.status,"status")} ${this.badge(task.priority,"priority")} ${task.evidence_required ? this.badge("Evidence Required","flag") : ""} ${task.approval_required ? this.badge("Approval Required","flag") : ""}</div>
          <h2>${task.title}</h2>
          <p>${task.description}</p>
        </section>
        <section class="detail-grid-two">
          <div><label>Task ID</label><strong>${task.task_id}</strong></div>
          <div><label>Category</label><strong>${task.category}</strong></div>
          <div><label>Assigned To</label><strong>${task.assigned_to_name}</strong></div>
          <div><label>Assigned By</label><strong>${task.assigned_by_name}</strong></div>
          <div><label>Due At</label><strong>${this.formatDate(task.due_at)}</strong></div>
          <div><label>Escalation Level</label><strong>${task.escalation_level||0}</strong></div>
        </section>
        <section class="action-grid">
          <button class="btn btn-primary" onclick="PortalActions.acknowledgeTask('${task.task_id}')">Acknowledge</button>
          <button class="btn btn-primary" onclick="PortalActions.startTask('${task.task_id}')">Start</button>
          <button class="btn btn-primary" onclick="PortalActions.markDone('${task.task_id}')">Mark Done</button>
          <button class="btn btn-soft" onclick="PortalActions.requestDelay('${task.task_id}')">Request Delay</button>
          <button class="btn btn-soft" onclick="PortalActions.delegateTask('${task.task_id}')">Delegate</button>
          <button class="btn btn-soft" onclick="PortalActions.createHandover('${task.task_id}')">Create Handover</button>
          <button class="btn btn-soft" onclick="PortalActions.reopenTask('${task.task_id}')">Reopen</button>
        </section>
      </div>`;
    document.getElementById("taskDrawer").classList.add("open");
  },
  closeDrawer() { document.getElementById("taskDrawer").classList.remove("open"); },
  modal(html) {
    document.getElementById("actionModalBody").innerHTML = html;
    document.getElementById("actionModal").classList.add("open");
  },
  closeModal() { document.getElementById("actionModal").classList.remove("open"); }
};

window.PortalActions = {
  acknowledgeTask(taskId){ alert(`Prototype action: acknowledge ${taskId}`); },
  startTask(taskId){ alert(`Prototype action: start ${taskId}`); },
  markDone(taskId){ alert(`Prototype action: mark done ${taskId}`); },
  reopenTask(taskId){ alert(`Prototype action: reopen ${taskId}`); },
  requestDelay(taskId){
    PortalUI.modal(`
      <div class="modal-header"><h3>Delay Request</h3><button class="btn btn-soft" onclick="PortalUI.closeModal()">Close</button></div>
      <div class="form-grid">
        <input placeholder="Task ID" value="${taskId}" disabled />
        <input type="datetime-local" />
        <textarea placeholder="Delay reason"></textarea>
        <button class="btn btn-primary" onclick="alert('Prototype delay request submitted');PortalUI.closeModal()">Submit Delay Request</button>
      </div>`);
  },
  delegateTask(taskId){
    const users = Store.users().map(u=>`<option value="${u.user_id}">${u.full_name} • ${u.role}</option>`).join("");
    PortalUI.modal(`
      <div class="modal-header"><h3>Delegate Task</h3><button class="btn btn-soft" onclick="PortalUI.closeModal()">Close</button></div>
      <div class="form-grid">
        <input placeholder="Task ID" value="${taskId}" disabled />
        <select>${users}</select>
        <textarea placeholder="Delegation reason"></textarea>
        <button class="btn btn-primary" onclick="alert('Prototype delegation submitted');PortalUI.closeModal()">Submit Delegation</button>
      </div>`);
  },
  createHandover(taskId){
    const users = Store.users().map(u=>`<option value="${u.user_id}">${u.full_name} • ${u.role}</option>`).join("");
    PortalUI.modal(`
      <div class="modal-header"><h3>Create Handover</h3><button class="btn btn-soft" onclick="PortalUI.closeModal()">Close</button></div>
      <div class="form-grid">
        <input placeholder="Task ID" value="${taskId}" disabled />
        <select>${users}</select>
        <textarea placeholder="Handover note"></textarea>
        <button class="btn btn-primary" onclick="alert('Prototype handover submitted');PortalUI.closeModal()">Create Handover</button>
      </div>`);
  }
};

window.PageRenderers = {
  dashboard() {
    const s = Store.stats();
    const content = document.getElementById("pageContent");
    content.innerHTML = `
      <section class="metrics-grid">
        ${PortalUI.metricCard("Total Tasks", s.total)}
        ${PortalUI.metricCard("Open Tasks", s.open)}
        ${PortalUI.metricCard("Completed", s.completed)}
        ${PortalUI.metricCard("Overdue", s.overdue)}
        ${PortalUI.metricCard("Escalated", s.escalated)}
        ${PortalUI.metricCard("Completion Rate", s.completionRate + "%")}
        ${PortalUI.metricCard("Pending Approvals", s.approvalsPending)}
        ${PortalUI.metricCard("Delegated", s.delegated)}
      </section>
      <section class="two-col">
        <article class="panel">
          <div class="panel-head"><h3>Due / Open Tasks</h3><a class="btn btn-soft" href="./my-tasks.html">View all</a></div>
          ${PortalUI.table(["Task","Status","Priority","Due","Action"], Store.myTasks().slice(0,8).map(t=>`<tr><td><strong>${t.title}</strong><br><small>${t.category}</small></td><td>${PortalUI.badge(t.status)}</td><td>${PortalUI.badge(t.priority,"priority")}</td><td>${PortalUI.formatDate(t.due_at)}</td><td><button class="btn btn-soft" onclick="PortalUI.openDrawer('${t.task_id}')">Open</button></td></tr>`).join(""))}
        </article>
        <article class="panel">
          <div class="panel-head"><h3>Recent Activity</h3></div>
          <div class="timeline">
            ${Store.activity().map(x=>`<div class="timeline-item"><strong>${x.action_type.replace(/_/g," ")}</strong><p>${x.note}</p><small>${x.action_by_name} • ${PortalUI.formatDate(x.action_timestamp)}</small></div>`).join("")}
          </div>
        </article>
      </section>
      <section class="three-col">
        <article class="panel"><div class="panel-head"><h3>Pending Approvals</h3></div>${Store.approvals().map(a=>`<div class="stack-card"><strong>${a.approval_type.toUpperCase()}</strong><p>${a.task_id} • ${a.requested_by_name}</p><small>${PortalUI.formatDate(a.requested_at)}</small></div>`).join("")}</article>
        <article class="panel"><div class="panel-head"><h3>Notifications</h3></div>${Store.notifications().map(n=>`<div class="stack-card"><strong>${n.title}</strong><p>${n.message}</p><small>${PortalUI.formatDate(n.sent_at)}</small></div>`).join("")}</article>
        <article class="panel"><div class="panel-head"><h3>Pending Handovers</h3></div>${Store.handovers().map(h=>`<div class="stack-card"><strong>${h.task_id}</strong><p>${h.handover_note}</p><small>${h.handover_from_name} → ${h.handover_to_name}</small></div>`).join("")}</article>
      </section>`;
  },
  myTasks() {
    const tasks = Store.myTasks();
    document.getElementById("pageContent").innerHTML = `
      <article class="panel">
        <div class="panel-head"><h3>My Tasks</h3><div class="toolbar"><input id="myTaskFilter" placeholder="Filter my tasks" /></div></div>
        ${PortalUI.table(["Task ID","Title","Status","Priority","Due","Assigned By","Actions"], tasks.map(t=>`<tr><td>${t.task_id}</td><td><strong>${t.title}</strong><br><small>${t.description}</small></td><td>${PortalUI.badge(t.status)}</td><td>${PortalUI.badge(t.priority,"priority")}</td><td>${PortalUI.formatDate(t.due_at)}</td><td>${t.assigned_by_name}</td><td><button class="btn btn-soft" onclick="PortalUI.openDrawer('${t.task_id}')">Details</button></td></tr>`).join(""))}
      </article>`;
  },
  departmentTasks() {
    const tasks = Store.departmentTasks();
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Team / Department Tasks</h3></div>${PortalUI.table(["Task","Assigned To","Role","Status","Priority","Due","Escalation"], tasks.map(t=>`<tr><td><strong>${t.title}</strong><br><small>${t.category}</small></td><td>${t.assigned_to_name}</td><td>${t.assigned_to_role}</td><td>${PortalUI.badge(t.status)}</td><td>${PortalUI.badge(t.priority,"priority")}</td><td>${PortalUI.formatDate(t.due_at)}</td><td>${t.escalation_level||0}</td></tr>`).join(""))}</article>`;
  },
  assignTask() {
    const opts = Store.users().map(u=>`<option value="${u.user_id}">${u.full_name} • ${u.role}</option>`).join("");
    const tpls = Store.templates().map(t=>`<option value="${t.template_id}">${t.template_name}</option>`).join("");
    document.getElementById("pageContent").innerHTML = `
      <article class="panel">
        <div class="panel-head"><h3>Manual Assignment / Template Assignment</h3></div>
        <div class="form-grid">
          <select><option>Select template</option>${tpls}</select>
          <input placeholder="Task title" />
          <textarea placeholder="Description / instructions"></textarea>
          <select><option>Select employee</option>${opts}</select>
          <select><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select>
          <input type="datetime-local" />
          <select><option>Manual Task</option><option>Auto Recurring Task</option><option>Trigger-Based Task</option><option>Approval Task</option><option>Follow-Up Task</option></select>
          <select><option>Reminder Rule RR001</option><option>Reminder Rule RR002</option></select>
          <select><option>Escalation Rule ER001</option><option>Escalation Rule ER002</option></select>
          <label class="check"><input type="checkbox" /> Evidence Required</label>
          <label class="check"><input type="checkbox" /> Approval Required</label>
          <button class="btn btn-primary" onclick="alert('Prototype task assignment created')">Assign Task</button>
        </div>
      </article>`;
  },
  templates() {
    document.getElementById("pageContent").innerHTML = `
      <article class="panel">
        <div class="panel-head"><h3>Task Templates</h3><button class="btn btn-primary" onclick="alert('Prototype create template')">Create Template</button></div>
        <div class="card-grid">
          ${Store.templates().map(t=>`<div class="template-card"><div class="chip-row">${PortalUI.badge(t.category,"flag")} ${PortalUI.badge(t.default_priority,"priority")}</div><h4>${t.template_name}</h4><p>${t.description}</p><small>Default target: ${t.default_role_target} • Recurrence: ${t.recurrence_type_default}</small><div class="card-actions"><button class="btn btn-soft">Assign</button><button class="btn btn-soft">Edit</button></div></div>`).join("")}
        </div>
      </article>`;
  },
  recurring() {
    const recurring = Store.templates().filter(t=>t.recurrence_supported).slice(0,12);
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Recurring Task Schedule</h3><button class="btn btn-primary" onclick="alert('Prototype generation run')">Run Generation Now</button></div><div class="stack-list">${recurring.map((r,i)=>`<div class="stack-card"><strong>${r.template_name}</strong><p>${r.recurrence_type_default} • Reminder ${r.reminder_rule_id} • Escalation ${r.escalation_rule_id}</p><small>Assigned role: ${r.default_role_target} • Next run: 2026-04-${String((i%7)+4).padStart(2,'0')} 08:00</small></div>`).join("")}</div></article>`;
  },
  approvals() {
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Approval Center</h3></div><div class="stack-list">${Store.approvals().map(a=>`<div class="approval-card"><div><strong>${a.approval_type.toUpperCase()} • ${a.task_id}</strong><p>${a.requested_by_name}</p><small>${PortalUI.formatDate(a.requested_at)}</small></div><div class="card-actions"><button class="btn btn-primary">Approve</button><button class="btn btn-soft">Reject</button></div></div>`).join("")}</div></article>`;
  },
  escalations() {
    const tasks = Store.departmentTasks().filter(t=>["Escalated","Overdue"].includes(t.status));
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Escalation Center</h3></div>${PortalUI.table(["Task","Owner","Status","Level","Due","Action"], tasks.map(t=>`<tr><td><strong>${t.title}</strong></td><td>${t.assigned_to_name}</td><td>${PortalUI.badge(t.status)}</td><td>${t.escalation_level||0}</td><td>${PortalUI.formatDate(t.due_at)}</td><td><button class="btn btn-soft" onclick="PortalUI.openDrawer('${t.task_id}')">Review</button></td></tr>`).join(""))}</article>`;
  },
  notifications() {
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Notifications Center</h3></div><div class="stack-list">${Store.notifications().map(n=>`<div class="stack-card"><strong>${n.title}</strong><p>${n.message}</p><small>${n.channel} • ${PortalUI.formatDate(n.sent_at)}</small></div>`).join("")}</div></article>`;
  },
  activityLog() {
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Activity / Audit Log</h3></div><div class="timeline">${Store.activity().map(x=>`<div class="timeline-item"><strong>${x.action_type}</strong><p>${x.note}</p><small>${x.action_by_name} • ${PortalUI.formatDate(x.action_timestamp)}</small></div>`).join("")}</div></article>`;
  },
  reports() {
    const byUser = {};
    Store.departmentTasks().forEach(t => {
      const key = t.assigned_to_name;
      byUser[key] = byUser[key] || { total:0, completed:0, overdue:0 };
      byUser[key].total++;
      if(["Completed","Closed"].includes(t.status)) byUser[key].completed++;
      if(["Overdue","Escalated"].includes(t.status)) byUser[key].overdue++;
    });
    document.getElementById("pageContent").innerHTML = `
      <section class="two-col">
        <article class="panel"><div class="panel-head"><h3>Workload by User</h3></div>${PortalUI.table(["User","Total","Completed","Overdue"], Object.entries(byUser).map(([k,v])=>`<tr><td>${k}</td><td>${v.total}</td><td>${v.completed}</td><td>${v.overdue}</td></tr>`).join(""))}</article>
        <article class="panel"><div class="panel-head"><h3>Task Aging Summary</h3></div><div class="stack-list"><div class="stack-card"><strong>0-4 Hours</strong><p>7 open tasks</p></div><div class="stack-card"><strong>4-8 Hours</strong><p>4 open tasks</p></div><div class="stack-card"><strong>8+ Hours</strong><p>3 open tasks</p></div><div class="stack-card"><strong>Repeated Overdue Users</strong><p>2 users flagged for follow-up</p></div></div></article>
      </section>`;
  },
  personalTodo() {
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Personal To-Do</h3><button class="btn btn-primary" onclick="alert('Prototype todo created')">Add To-Do</button></div><div class="form-grid compact"><input placeholder="To-do title" /><input type="datetime-local" /><select><option>Low</option><option selected>Medium</option><option>High</option></select><button class="btn btn-soft">Save</button></div><div class="stack-list">${Store.todos().map(t=>`<div class="stack-card"><strong>${t.title}</strong><p>${PortalUI.badge(t.priority,'priority')} ${PortalUI.badge(t.status)}</p><small>Due ${PortalUI.formatDate(t.due_at)}</small></div>`).join("")}</div></article>`;
  },
  handover() {
    document.getElementById("pageContent").innerHTML = `<article class="panel"><div class="panel-head"><h3>Handover Workflow</h3><button class="btn btn-primary" onclick="alert('Prototype handover created')">Create Handover</button></div>${PortalUI.table(["Task","From","To","Status","Shift","Action"], Store.handovers().map(h=>`<tr><td>${h.task_id}</td><td>${h.handover_from_name}</td><td>${h.handover_to_name}</td><td>${PortalUI.badge(h.handover_status,'status')}</td><td>${h.shift_reference}</td><td><button class="btn btn-soft">Acknowledge</button></td></tr>`).join(""))}</article>`;
  }
};

window.bootstrapPage = async function(activeKey, title, subtitle, rendererKey) {
  await Store.init();
  PortalShell.renderShell(activeKey, title, subtitle);
  PageRenderers[rendererKey]();
  document.getElementById("actionModal").addEventListener("click", (e) => { if (e.target.id === "actionModal") PortalUI.closeModal(); });
};
