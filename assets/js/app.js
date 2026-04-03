window.Store = {
  currentUser: null,
  dashboard: null,
  myTasks: [],
  departmentTasks: [],
  templates: [],
  notifications: [],
  approvals: [],
  activity: [],
  reports: null,
  recurring: [],
  handovers: [],
  todos: [],
  assignableUsers: [],
  getTask(taskId) {
    return [...this.myTasks, ...this.departmentTasks].find(t => t.task_id === taskId) || null;
  }
};

window.PortalUI = {
  badge(text, kind = 'status') {
    const clean = String(text || 'Unknown').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `<span class="badge ${kind}-${clean}">${text || 'Unknown'}</span>`;
  },
  formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).replace('T', ' ').slice(0, 16);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(d);
  },
  escape(text) {
    return String(text || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  },
  empty(title, desc) {
    return `<div class="empty-state"><div class="empty-icon">◌</div><h3>${title}</h3><p>${desc}</p></div>`;
  },
  toast(message, type = 'info') {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },
  openModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('actionModalBody').innerHTML = html;
    document.getElementById('actionModal').classList.add('open');
  },
  closeModal() {
    document.getElementById('actionModal').classList.remove('open');
  },
  openDrawer(taskId) {
    const task = Store.getTask(taskId);
    if (!task) return;
    document.getElementById('drawerTitle').textContent = task.title;
    document.getElementById('taskDrawerBody').innerHTML = `
      <div class="drawer-hero">
        <div class="board-tags">${this.badge(task.status, 'status')} ${this.badge(task.priority, 'priority')}</div>
        <h2>${this.escape(task.title)}</h2>
        <p>${this.escape(task.description || '')}</p>
      </div>
      <div class="detail-grid">
        <div class="detail-card"><label>Task ID</label><strong>${this.escape(task.task_id)}</strong></div>
        <div class="detail-card"><label>Category</label><strong>${this.escape(task.category || '—')}</strong></div>
        <div class="detail-card"><label>Assigned To</label><strong>${this.escape(task.assigned_to_name || '—')}</strong></div>
        <div class="detail-card"><label>Assigned By</label><strong>${this.escape(task.assigned_by_name || '—')}</strong></div>
        <div class="detail-card"><label>Due At</label><strong>${this.formatDate(task.due_at)}</strong></div>
        <div class="detail-card"><label>Status</label><strong>${this.escape(task.status || '—')}</strong></div>
      </div>
      <div class="drawer-actions">
        <button class="btn btn-primary" onclick="PortalActions.acknowledgeTask('${task.task_id}')">Acknowledge</button>
        <button class="btn btn-primary" onclick="PortalActions.startTask('${task.task_id}')">Start</button>
        <button class="btn btn-primary" onclick="PortalActions.markDone('${task.task_id}')">Mark Done</button>
        <button class="btn btn-outline" onclick="PortalActions.requestDelay('${task.task_id}')">Request Delay</button>
        <button class="btn btn-outline" onclick="PortalActions.delegateTask('${task.task_id}')">Delegate</button>
        <button class="btn btn-outline" onclick="PortalActions.createHandover('${task.task_id}')">Handover</button>
        <button class="btn btn-outline" onclick="PortalActions.reopenTask('${task.task_id}')">Reopen</button>
      </div>
    `;
    document.getElementById('taskDrawer').classList.add('open');
  },
  closeDrawer() {
    document.getElementById('taskDrawer').classList.remove('open');
  },
  table(headers, rows) {
    return `<div class="table-shell"><table class="data-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">${PortalUI.empty('No data found', 'Nothing to show here yet.')}</td></tr>`}</tbody></table></div>`;
  }
};

window.PortalActions = {
  logout() {
    Auth.clearSession();
    Auth.redirectToLogin();
  },
  payloadBase() {
    return { user_id: Store.currentUser.user_id, user_name: Store.currentUser.full_name };
  },
  async acknowledgeTask(taskId) {
    try {
      const res = await Api.acknowledgeTask({ ...this.payloadBase(), task_id: taskId });
      if (!res.success) throw new Error(res.error || 'Failed');
      PortalUI.toast('Task acknowledged', 'success');
      location.reload();
    } catch (e) { PortalUI.toast(e.message, 'error'); }
  },
  async startTask(taskId) {
    try {
      const res = await Api.startTask({ ...this.payloadBase(), task_id: taskId });
      if (!res.success) throw new Error(res.error || 'Failed');
      PortalUI.toast('Task started', 'success');
      location.reload();
    } catch (e) { PortalUI.toast(e.message, 'error'); }
  },
  async markDone(taskId) {
    PortalUI.openModal('Mark Task Done', `
      <form id="markDoneForm" class="form-grid single">
        <textarea id="doneNote" placeholder="Completion note" required></textarea>
        <input id="doneEvidence" placeholder="Evidence link (optional)" />
        <button class="btn btn-primary" type="submit">Submit Completion</button>
      </form>
    `);
    document.getElementById('markDoneForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await Api.markTaskDone({
          ...this.payloadBase(),
          task_id: taskId,
          completion_note: document.getElementById('doneNote').value,
          evidence_link: document.getElementById('doneEvidence').value
        });
        if (!res.success) throw new Error(res.error || 'Failed');
        PortalUI.closeModal();
        PortalUI.toast('Task updated', 'success');
        location.reload();
      } catch (err) { PortalUI.toast(err.message, 'error'); }
    };
  },
  async reopenTask(taskId) {
    try {
      const res = await Api.reopenTask({ ...this.payloadBase(), task_id: taskId, note: 'Reopened from portal' });
      if (!res.success) throw new Error(res.error || 'Failed');
      PortalUI.toast('Task reopened', 'success');
      location.reload();
    } catch (e) { PortalUI.toast(e.message, 'error'); }
  },
  requestDelay(taskId) {
    PortalUI.openModal('Request Delay', `
      <form id="delayForm" class="form-grid single">
        <input id="delayDueAt" type="datetime-local" required />
        <textarea id="delayReason" placeholder="Delay reason" required></textarea>
        <button class="btn btn-primary" type="submit">Submit Delay Request</button>
      </form>
    `);
    document.getElementById('delayForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await Api.requestDelay({
          ...this.payloadBase(),
          task_id: taskId,
          approver_user_id: '',
          approver_name: '',
          new_due_at: document.getElementById('delayDueAt').value,
          reason: document.getElementById('delayReason').value
        });
        if (!res.success) throw new Error(res.error || 'Failed');
        PortalUI.closeModal();
        PortalUI.toast('Delay request submitted', 'success');
        location.reload();
      } catch (err) { PortalUI.toast(err.message, 'error'); }
    };
  },
  delegateTask(taskId) {
    const options = Store.assignableUsers.map(u => `<option value="${u.user_id}" data-name="${PortalUI.escape(u.full_name)}">${PortalUI.escape(u.full_name)} • ${PortalUI.escape(u.role)}</option>`).join('');
    PortalUI.openModal('Delegate Task', `
      <form id="delegateForm" class="form-grid single">
        <select id="delegateUser" required><option value="">Select user</option>${options}</select>
        <textarea id="delegateReason" placeholder="Delegation reason" required></textarea>
        <button class="btn btn-primary" type="submit">Submit Delegation</button>
      </form>
    `);
    document.getElementById('delegateForm').onsubmit = async (e) => {
      e.preventDefault();
      const sel = document.getElementById('delegateUser');
      const name = sel.options[sel.selectedIndex].text.split(' • ')[0];
      try {
        const res = await Api.delegateTask({
          ...this.payloadBase(),
          task_id: taskId,
          to_user_id: sel.value,
          to_user_name: name,
          reason: document.getElementById('delegateReason').value
        });
        if (!res.success) throw new Error(res.error || 'Failed');
        PortalUI.closeModal();
        PortalUI.toast('Task delegated', 'success');
        location.reload();
      } catch (err) { PortalUI.toast(err.message, 'error'); }
    };
  },
  createHandover(taskId) {
    const options = Store.assignableUsers.map(u => `<option value="${u.user_id}">${PortalUI.escape(u.full_name)} • ${PortalUI.escape(u.role)}</option>`).join('');
    PortalUI.openModal('Create Handover', `
      <form id="handoverForm" class="form-grid single">
        <select id="handoverUser" required><option value="">Select recipient</option>${options}</select>
        <textarea id="handoverNote" placeholder="Handover note" required></textarea>
        <input id="handoverShift" placeholder="Shift reference" />
        <button class="btn btn-primary" type="submit">Submit Handover</button>
      </form>
    `);
    document.getElementById('handoverForm').onsubmit = async (e) => {
      e.preventDefault();
      const sel = document.getElementById('handoverUser');
      const name = sel.options[sel.selectedIndex].text.split(' • ')[0];
      try {
        const res = await Api.createHandover({
          ...this.payloadBase(),
          task_id: taskId,
          to_user_id: sel.value,
          to_user_name: name,
          note: document.getElementById('handoverNote').value,
          shift_reference: document.getElementById('handoverShift').value
        });
        if (!res.success) throw new Error(res.error || 'Failed');
        PortalUI.closeModal();
        PortalUI.toast('Handover created', 'success');
        location.reload();
      } catch (err) { PortalUI.toast(err.message, 'error'); }
    };
  }
};

function groupTasks(tasks) {
  return {
    assigned: tasks.filter(t => ['Assigned', 'Acknowledged'].includes(t.status)),
    progress: tasks.filter(t => ['In Progress', 'Pending Input', 'Delegated', 'Deferred Approved'].includes(t.status)),
    approval: tasks.filter(t => ['Pending Approval', 'Deferred Requested', 'Handover In Progress'].includes(t.status)),
    risk: tasks.filter(t => ['Overdue', 'Escalated', 'Rejected'].includes(t.status))
  };
}

function taskCard(task) {
  return `
    <article class="task-card" onclick="PortalUI.openDrawer('${task.task_id}')">
      <div class="task-card-top">
        <div class="task-title-block">
          <h4>${PortalUI.escape(task.title)}</h4>
          <p>${PortalUI.escape(task.description || '')}</p>
        </div>
        <div class="task-mini-avatar">${PortalUI.escape((task.assigned_to_name || '?').charAt(0).toUpperCase())}</div>
      </div>
      <div class="board-tags">${PortalUI.badge(task.priority, 'priority')} ${PortalUI.badge(task.category || 'Task', 'flag')}</div>
      <div class="task-meta">Due ${PortalUI.formatDate(task.due_at)}</div>
    </article>
  `;
}

window.PageRenderers = {
  dashboard() {
    const d = Store.dashboard || { summary: {}, myTasks: [], recentActivity: [], pendingApprovals: [], notifications: [] };
    const summary = d.summary || {};
    const groups = groupTasks(Store.departmentTasks);
    document.getElementById('pageContent').innerHTML = `
      <section class="metrics-grid">
        <article class="metric-card metric-blue"><span>Total Tasks</span><strong>${summary.totalTasks || 0}</strong></article>
        <article class="metric-card metric-violet"><span>Open Tasks</span><strong>${summary.openTasks || 0}</strong></article>
        <article class="metric-card metric-cyan"><span>Completed</span><strong>${summary.completedTasks || 0}</strong></article>
        <article class="metric-card metric-green"><span>Approvals Pending</span><strong>${summary.approvalsPending || 0}</strong></article>
      </section>
      <section class="section-card">
        <div class="section-head"><div><div class="eyebrow">Execution Board</div><h3>Operational Task Flow</h3></div></div>
        <div class="board-grid">
          <section class="board-lane lane-violet"><header><span>Assigned</span><strong>${groups.assigned.length}</strong></header><div class="board-body">${groups.assigned.length ? groups.assigned.slice(0,6).map(taskCard).join('') : PortalUI.empty('No assigned tasks', 'Assigned tasks will appear here.')}</div></section>
          <section class="board-lane lane-blue"><header><span>In Progress</span><strong>${groups.progress.length}</strong></header><div class="board-body">${groups.progress.length ? groups.progress.slice(0,6).map(taskCard).join('') : PortalUI.empty('No active tasks', 'Work in progress will appear here.')}</div></section>
          <section class="board-lane lane-cyan"><header><span>Approval / Handover</span><strong>${groups.approval.length}</strong></header><div class="board-body">${groups.approval.length ? groups.approval.slice(0,6).map(taskCard).join('') : PortalUI.empty('No waiting items', 'Approval and handover items will appear here.')}</div></section>
          <section class="board-lane lane-green"><header><span>Overdue / Escalated</span><strong>${groups.risk.length}</strong></header><div class="board-body">${groups.risk.length ? groups.risk.slice(0,6).map(taskCard).join('') : PortalUI.empty('No risk items', 'Overdue and escalated tasks will appear here.')}</div></section>
        </div>
      </section>
      <section class="content-grid two-col">
        <article class="section-card">
          <div class="section-head"><h3>My Tasks</h3><a class="text-link" href="./my-tasks.html">View all</a></div>
          ${PortalUI.table(['Task','Status','Priority','Due','Action'], d.myTasks?.length ? d.myTasks.slice(0,8).map(t => `<tr><td><strong>${PortalUI.escape(t.title)}</strong><br><small>${PortalUI.escape(t.category || '')}</small></td><td>${PortalUI.badge(t.status, 'status')}</td><td>${PortalUI.badge(t.priority, 'priority')}</td><td>${PortalUI.formatDate(t.due_at)}</td><td><button class="btn btn-sm btn-outline" onclick="event.stopPropagation();PortalUI.openDrawer('${t.task_id}')">Open</button></td></tr>`).join('') : '')}
        </article>
        <article class="section-card">
          <div class="section-head"><h3>Recent Activity</h3></div>
          <div class="activity-list">${d.recentActivity?.length ? d.recentActivity.map(x => `<div class="activity-item"><strong>${PortalUI.escape(String(x.action_type || '').replace(/_/g, ' '))}</strong><p>${PortalUI.escape(x.note || '')}</p><small>${PortalUI.escape(x.action_by_name || '')} • ${PortalUI.formatDate(x.action_timestamp)}</small></div>`).join('') : PortalUI.empty('No recent activity', 'Activity logs will appear here.')}</div>
        </article>
      </section>
    `;
  },
  myTasks() {
    const tasks = Store.myTasks;
    document.getElementById('pageContent').innerHTML = `<section class="section-card"><div class="section-head"><h3>My Tasks</h3></div>${PortalUI.table(['Task ID','Title','Status','Priority','Due','Assigned By','Action'], tasks.length ? tasks.map(t => `<tr><td>${PortalUI.escape(t.task_id)}</td><td><strong>${PortalUI.escape(t.title)}</strong><br><small>${PortalUI.escape(t.description || '')}</small></td><td>${PortalUI.badge(t.status, 'status')}</td><td>${PortalUI.badge(t.priority, 'priority')}</td><td>${PortalUI.formatDate(t.due_at)}</td><td>${PortalUI.escape(t.assigned_by_name || '—')}</td><td><button class="btn btn-sm btn-outline" onclick="PortalUI.openDrawer('${t.task_id}')">Details</button></td></tr>`).join('') : '')}</section>`;
  },
  departmentTasks() {
    const tasks = Store.departmentTasks;
    document.getElementById('pageContent').innerHTML = `<section class="section-card"><div class="section-head"><h3>Team / Department Tasks</h3></div>${PortalUI.table(['Task','Assigned To','Role','Status','Priority','Due','Escalation'], tasks.length ? tasks.map(t => `<tr><td><strong>${PortalUI.escape(t.title)}</strong><br><small>${PortalUI.escape(t.category || '')}</small></td><td>${PortalUI.escape(t.assigned_to_name || '—')}</td><td>${PortalUI.escape(t.assigned_to_role || '—')}</td><td>${PortalUI.badge(t.status, 'status')}</td><td>${PortalUI.badge(t.priority, 'priority')}</td><td>${PortalUI.formatDate(t.due_at)}</td><td>${PortalUI.escape(String(t.escalation_level || 0))}</td></tr>`).join('') : '')}</section>`;
  },
  assignTask() {
    const options = Store.assignableUsers.map(u => `<option value="${u.user_id}" data-role="${PortalUI.escape(u.role)}">${PortalUI.escape(u.full_name)} • ${PortalUI.escape(u.role)}</option>`).join('');
    const templates = Store.templates.map(t => `<option value="${t.template_id}">${PortalUI.escape(t.template_name)}</option>`).join('');
    document.getElementById('pageContent').innerHTML = `
      <section class="section-card">
        <div class="section-head"><h3>Manual Assignment</h3></div>
        <form id="assignTaskForm" class="form-grid double">
          <select id="templateId"><option value="">Select template (optional)</option>${templates}</select>
          <input id="taskTitle" placeholder="Task title" required />
          <textarea id="taskDescription" placeholder="Instructions / description"></textarea>
          <select id="assigneeId" required><option value="">Select employee</option>${options}</select>
          <input id="taskDueAt" type="datetime-local" required />
          <select id="taskPriority"><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select>
          <input id="taskCategory" placeholder="Category" />
          <input id="taskSubcategory" placeholder="Subcategory" />
          <select id="taskType"><option>Manual Task</option><option>Follow-Up Task</option><option>Approval Task</option><option>Trigger-Based Task</option></select>
          <div class="toggle-row">
            <label class="toggle-box"><input type="checkbox" id="evidenceRequired"> <span>Evidence Required</span></label>
            <label class="toggle-box"><input type="checkbox" id="approvalRequired"> <span>Approval Required</span></label>
          </div>
          <button class="btn btn-primary" type="submit">Assign Task</button>
        </form>
      </section>`;

    document.getElementById('assignTaskForm').onsubmit = async (e) => {
      e.preventDefault();
      const assignee = Store.assignableUsers.find(x => x.user_id === document.getElementById('assigneeId').value);
      try {
        const res = await Api.createTask({
          created_by_user_id: Store.currentUser.user_id,
          template_id: document.getElementById('templateId').value,
          title: document.getElementById('taskTitle').value,
          description: document.getElementById('taskDescription').value,
          assigned_to_user_id: assignee.user_id,
          assigned_to_name: assignee.full_name,
          assigned_to_role: assignee.role,
          task_type: document.getElementById('taskType').value,
          category: document.getElementById('taskCategory').value,
          subcategory: document.getElementById('taskSubcategory').value,
          due_at: document.getElementById('taskDueAt').value,
          priority: document.getElementById('taskPriority').value,
          department: Store.currentUser.department,
          team: assignee.team || '',
          evidence_required: document.getElementById('evidenceRequired').checked,
          approval_required: document.getElementById('approvalRequired').checked,
          created_source: 'portal'
        });
        if (!res.success) throw new Error(res.error || 'Failed to assign task');
        PortalUI.toast('Task assigned successfully', 'success');
        e.target.reset();
      } catch (err) { PortalUI.toast(err.message, 'error'); }
    };
  },
  templates() {
    document.getElementById('pageContent').innerHTML = `
      <section class="section-card">
        <div class="section-head"><h3>Task Templates</h3><button class="btn btn-primary" id="newTemplateBtn">New Template</button></div>
        <div class="template-grid">${Store.templates.length ? Store.templates.map(t => `<article class="template-card"><div class="board-tags">${PortalUI.badge(t.category || 'Template', 'flag')} ${PortalUI.badge(t.default_priority || 'Medium', 'priority')}</div><h4>${PortalUI.escape(t.template_name)}</h4><p>${PortalUI.escape(t.description || '')}</p><small>Default target: ${PortalUI.escape(t.default_role_target || '—')}</small></article>`).join('') : PortalUI.empty('No templates found', 'Create templates after setting up your workbook.')}</div>
      </section>`;

    document.getElementById('newTemplateBtn').onclick = () => {
      PortalUI.openModal('Create Template', `
        <form id="templateForm" class="form-grid single">
          <input id="tplName" placeholder="Template name" required />
          <textarea id="tplDesc" placeholder="Description"></textarea>
          <input id="tplCategory" placeholder="Category" />
          <input id="tplTargetRole" placeholder="Default target role" />
          <select id="tplPriority"><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select>
          <button class="btn btn-primary" type="submit">Save Template</button>
        </form>
      `);
      document.getElementById('templateForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
          const res = await Api.createTemplate({
            template: {
              template_name: document.getElementById('tplName').value,
              description: document.getElementById('tplDesc').value,
              category: document.getElementById('tplCategory').value,
              default_role_target: document.getElementById('tplTargetRole').value,
              default_priority: document.getElementById('tplPriority').value,
              task_type: 'Manual Task',
              evidence_required: false,
              approval_required: false,
              recurrence_supported: false,
              recurrence_type_default: '',
              recurrence_rule_default: '',
              reminder_rule_id: '',
              escalation_rule_id: '',
              active_flag: true,
              created_by: Store.currentUser.full_name
            }
          });
          if (!res.success) throw new Error(res.error || 'Failed');
          PortalUI.closeModal();
          PortalUI.toast('Template created', 'success');
          location.reload();
        } catch (err) { PortalUI.toast(err.message, 'error'); }
      };
    };
  },
  recurring() {
    const groups = {
      daily: Store.recurring.filter(x => String(x.recurrence_type).toLowerCase() === 'daily'),
      weekly: Store.recurring.filter(x => String(x.recurrence_type).toLowerCase() === 'weekly'),
      monthly: Store.recurring.filter(x => String(x.recurrence_type).toLowerCase() === 'monthly'),
      other: Store.recurring.filter(x => !['daily', 'weekly', 'monthly'].includes(String(x.recurrence_type).toLowerCase()))
    };
    const lane = (title, cls, arr) => `<section class="board-lane ${cls}"><header><span>${title}</span><strong>${arr.length}</strong></header><div class="board-body">${arr.length ? arr.map(r => `<article class="task-card"><div class="task-title-block"><h4>${PortalUI.escape(r.template_name || r.schedule_id)}</h4><p>${PortalUI.escape(r.assigned_to_name || r.assigned_role || '')}</p></div><div class="board-tags">${PortalUI.badge(r.reminder_rule_id || 'No reminder', 'flag')} ${PortalUI.badge(r.escalation_rule_id || 'No escalation', 'flag')}</div><div class="task-meta">Next run ${PortalUI.formatDate(r.next_run_at)}</div></article>`).join('') : PortalUI.empty('No schedules', 'No recurring schedules in this lane.')}</div></section>`;
    document.getElementById('pageContent').innerHTML = `
      <section class="section-card">
        <div class="section-head"><div><div class="eyebrow">Recurring Engine</div><h3>Recurring Task Schedule</h3></div><button class="btn btn-primary" id="runRecurringBtn">Run Generation Now</button></div>
        <div class="board-grid">${lane('Daily','lane-violet',groups.daily)}${lane('Weekly','lane-blue',groups.weekly)}${lane('Monthly','lane-cyan',groups.monthly)}${lane('Other','lane-green',groups.other)}</div>
      </section>`;
    document.getElementById('runRecurringBtn').onclick = async () => {
      try {
        const res = await Api.generateRecurringTasks({ user_id: Store.currentUser.user_id, user_name: Store.currentUser.full_name });
        if (!res.success) throw new Error(res.error || 'Failed');
        PortalUI.toast('Recurring generation completed', 'success');
        location.reload();
      } catch (err) { PortalUI.toast(err.message, 'error'); }
    };
  },
  approvals() {
    document.getElementById('pageContent').innerHTML = `<section class="section-card"><div class="section-head"><h3>Approval Center</h3></div><div class="approval-list">${Store.approvals.length ? Store.approvals.map(a => `<article class="approval-card"><div><strong>${PortalUI.escape((a.approval_type || '').toUpperCase())}</strong><p>${PortalUI.escape(a.task_id || '')} • ${PortalUI.escape(a.requested_by_name || '')}</p><small>${PortalUI.formatDate(a.requested_at)}</small></div><div class="card-actions"><button class="btn btn-sm btn-primary" onclick="PageRenderers.approveApproval('${a.approval_id}')">Approve</button><button class="btn btn-sm btn-outline" onclick="PageRenderers.rejectApproval('${a.approval_id}')">Reject</button></div></article>`).join('') : PortalUI.empty('No approvals pending', 'Approvals will appear here when requests are submitted.')}</div></section>`;
  },
  async approveApproval(approvalId) {
    try {
      const res = await Api.approveRequest({ user_id: Store.currentUser.user_id, user_name: Store.currentUser.full_name, approval_id: approvalId });
      if (!res.success) throw new Error(res.error || 'Failed');
      PortalUI.toast('Approval completed', 'success');
      location.reload();
    } catch (err) { PortalUI.toast(err.message, 'error'); }
  },
  async rejectApproval(approvalId) {
    try {
      const res = await Api.rejectRequest({ user_id: Store.currentUser.user_id, user_name: Store.currentUser.full_name, approval_id: approvalId });
      if (!res.success) throw new Error(res.error || 'Failed');
      PortalUI.toast('Request rejected', 'success');
      location.reload();
    } catch (err) { PortalUI.toast(err.message, 'error'); }
  },
  escalations() {
    const tasks = Store.departmentTasks.filter(t => ['Escalated', 'Overdue'].includes(t.status));
    document.getElementById('pageContent').innerHTML = `<section class="section-card"><div class="section-head"><h3>Escalation Center</h3></div>${PortalUI.table(['Task','Owner','Status','Level','Due','Action'], tasks.length ? tasks.map(t => `<tr><td><strong>${PortalUI.escape(t.title)}</strong></td><td>${PortalUI.escape(t.assigned_to_name || '—')}</td><td>${PortalUI.badge(t.status, 'status')}</td><td>${PortalUI.escape(String(t.escalation_level || 0))}</td><td>${PortalUI.formatDate(t.due_at)}</td><td><button class="btn btn-sm btn-outline" onclick="PortalUI.openDrawer('${t.task_id}')">Review</button></td></tr>`).join('') : '')}</section>`;
  },
  notifications() {
    document.getElementById('pageContent').innerHTML = `<section class="section-card"><div class="section-head"><h3>Notifications Center</h3></div><div class="activity-list">${Store.notifications.length ? Store.notifications.map(n => `<div class="activity-item"><strong>${PortalUI.escape(n.title || 'Notification')}</strong><p>${PortalUI.escape(n.message || '')}</p><small>${PortalUI.escape(n.channel || 'portal')} • ${PortalUI.formatDate(n.sent_at)}</small></div>`).join('') : PortalUI.empty('No notifications', 'Notifications will appear here.')}</div></section>`;
  },
  activityLog() {
    document.getElementById('pageContent').innerHTML = `<section class="section-card"><div class="section-head"><h3>Activity / Audit Log</h3></div><div class="activity-list">${Store.activity.length ? Store.activity.map(x => `<div class="activity-item"><strong>${PortalUI.escape(String(x.action_type || '').replace(/_/g, ' '))}</strong><p>${PortalUI.escape(x.note || '')}</p><small>${PortalUI.escape(x.action_by_name || '')} • ${PortalUI.formatDate(x.action_timestamp)}</small></div>`).join('') : PortalUI.empty('No activity found', 'Audit activity will appear here once actions start.')}</div></section>`;
  },
  reports() {
    const byUser = Store.reports?.byUser || {};
    const rows = Object.entries(byUser).map(([name, v]) => `<tr><td>${PortalUI.escape(name)}</td><td>${v.total || 0}</td><td>${v.completed || 0}</td><td>${v.overdue || 0}</td></tr>`).join('');
    document.getElementById('pageContent').innerHTML = `
      <section class="content-grid two-col">
        <article class="section-card"><div class="section-head"><h3>Workload by User</h3></div>${PortalUI.table(['User','Total','Completed','Overdue'], rows)}</article>
        <article class="section-card"><div class="section-head"><h3>Report Summary</h3></div><div class="activity-item"><strong>Total visible tasks</strong><p>${Store.reports?.total || 0}</p></div></article>
      </section>`;
  },
  personalTodo() {
    document.getElementById('pageContent').innerHTML = `
      <section class="section-card">
        <div class="section-head"><h3>Personal To-Do</h3></div>
        <form id="todoForm" class="form-grid triple compact-space">
          <input id="todoTitle" placeholder="To-do title" required />
          <input id="todoDueAt" type="datetime-local" />
          <select id="todoPriority"><option>Low</option><option selected>Medium</option><option>High</option></select>
          <textarea id="todoDesc" placeholder="Description"></textarea>
          <button class="btn btn-primary" type="submit">Save To-Do</button>
        </form>
        <div class="approval-list" style="margin-top:20px;">${Store.todos.length ? Store.todos.map(t => `<article class="approval-card"><div><strong>${PortalUI.escape(t.title)}</strong><p>${PortalUI.escape(t.description || '')}</p><small>${PortalUI.formatDate(t.due_at)}</small></div><div>${PortalUI.badge(t.priority || 'Medium', 'priority')} ${PortalUI.badge(t.status || 'Open', 'status')}</div></article>`).join('') : PortalUI.empty('No personal to-dos', 'Create your first personal to-do.')}</div>
      </section>`;
      document.getElementById('todoForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
          const res = await Api.createPersonalTodo({
            user_id: Store.currentUser.user_id,
            title: document.getElementById('todoTitle').value,
            description: document.getElementById('todoDesc').value,
            priority: document.getElementById('todoPriority').value,
            due_at: document.getElementById('todoDueAt').value
          });
          if (!res.success) throw new Error(res.error || 'Failed');
          PortalUI.toast('To-do created', 'success');
          location.reload();
        } catch (err) { PortalUI.toast(err.message, 'error'); }
      };
  },
  handover() {
    document.getElementById('pageContent').innerHTML = `<section class="section-card"><div class="section-head"><h3>Handover Workflow</h3></div>${PortalUI.table(['Task','From','To','Status','Shift','Action'], Store.handovers.length ? Store.handovers.map(h => `<tr><td>${PortalUI.escape(h.task_id || '')}</td><td>${PortalUI.escape(h.handover_from_name || '—')}</td><td>${PortalUI.escape(h.handover_to_name || '—')}</td><td>${PortalUI.badge(h.handover_status || 'Pending', 'status')}</td><td>${PortalUI.escape(h.shift_reference || '—')}</td><td><button class="btn btn-sm btn-outline" onclick="PageRenderers.acknowledgeHandover('${h.handover_id}')">Acknowledge</button></td></tr>`).join('') : '')}</section>`;
  },
  async acknowledgeHandover(handoverId) {
    try {
      const res = await Api.acknowledgeHandover({ handover_id: handoverId, user_id: Store.currentUser.user_id, user_name: Store.currentUser.full_name });
      if (!res.success) throw new Error(res.error || 'Failed');
      PortalUI.toast('Handover acknowledged', 'success');
      location.reload();
    } catch (err) { PortalUI.toast(err.message, 'error'); }
  }
};

async function loadPageData(rendererKey) {
  const userId = Store.currentUser.user_id;
  const loaders = {
    dashboard: async () => {
      const [dashboard, deptTasks] = await Promise.all([Api.getDashboardData(userId), Api.getDepartmentTasks(userId)]);
      if (!dashboard.success) throw new Error(dashboard.error || 'Failed loading dashboard');
      if (!deptTasks.success) throw new Error(deptTasks.error || 'Failed loading tasks');
      Store.dashboard = dashboard.data;
      Store.departmentTasks = deptTasks.data || [];
      Store.myTasks = dashboard.data.myTasks || [];
    },
    myTasks: async () => {
      const res = await Api.getMyTasks(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.myTasks = res.data || [];
    },
    departmentTasks: async () => {
      const res = await Api.getDepartmentTasks(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.departmentTasks = res.data || [];
    },
    assignTask: async () => {
      const [users, templates] = await Promise.all([Api.getAssignableUsers(userId), Api.getTaskTemplates(userId)]);
      if (!users.success) throw new Error(users.error || 'Failed'); if (!templates.success) throw new Error(templates.error || 'Failed');
      Store.assignableUsers = users.data || []; Store.templates = templates.data || [];
    },
    templates: async () => {
      const res = await Api.getTaskTemplates(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.templates = res.data || [];
    },
    recurring: async () => {
      const res = await Api.getRecurringSchedules(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.recurring = res.data || [];
    },
    approvals: async () => {
      const res = await Api.getApprovals(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.approvals = res.data || [];
    },
    escalations: async () => {
      const res = await Api.getDepartmentTasks(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.departmentTasks = res.data || [];
    },
    notifications: async () => {
      const res = await Api.getNotifications(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.notifications = res.data || [];
    },
    activityLog: async () => {
      const res = await Api.getActivityLog(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.activity = res.data || [];
    },
    reports: async () => {
      const res = await Api.getReportsData(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.reports = res.data || { byUser: {}, total: 0 };
    },
    personalTodo: async () => {
      const res = await Api.getPersonalTodos(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.todos = res.data || [];
    },
    handover: async () => {
      const res = await Api.getHandovers(userId); if (!res.success) throw new Error(res.error || 'Failed'); Store.handovers = res.data || [];
    }
  };
  if (loaders[rendererKey]) await loaders[rendererKey]();
}

window.bootstrapPage = async function(activeKey, title, subtitle, rendererKey) {
  try {
    await Auth.hydrateCurrentUser();
    await loadPageData(rendererKey);
    PortalShell.renderShell(activeKey, title, subtitle);
    PageRenderers[rendererKey]();
  } catch (e) {
    document.body.innerHTML = `<div class="fatal-state"><h2>Unable to load portal</h2><p>${PortalUI.escape(e.message)}</p><a class="btn btn-primary" href="../index.html">Back to login</a></div>`;
  }
};
