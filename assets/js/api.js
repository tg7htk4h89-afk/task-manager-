window.Api = {
  async request(action, payload = {}, method = 'POST') {
    const url = window.APP_CONFIG.apiBaseUrl;
    if (!url || url.startsWith('PUT_')) {
      throw new Error('API URL is not configured in assets/js/config.js');
    }

    if (method === 'GET') {
      const qs = new URLSearchParams({ action, ...payload }).toString();
      const res = await fetch(`${url}?${qs}`, { method: 'GET' });
      return await res.json();
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  },

  login(email, password) { return this.request('login', { email, password }, 'POST'); },
  getCurrentUser(user_id) { return this.request('getCurrentUser', { user_id }, 'GET'); },
  getDashboardData(user_id) { return this.request('getDashboardData', { user_id }, 'GET'); },
  getMyTasks(user_id) { return this.request('getMyTasks', { user_id }, 'GET'); },
  getDepartmentTasks(user_id) { return this.request('getDepartmentTasks', { user_id }, 'GET'); },
  getAssignableUsers(user_id) { return this.request('getAssignableUsers', { user_id }, 'GET'); },
  getTaskTemplates(user_id) { return this.request('getTaskTemplates', { user_id }, 'GET'); },
  getNotifications(user_id) { return this.request('getNotifications', { user_id }, 'GET'); },
  getApprovals(user_id) { return this.request('getApprovals', { user_id }, 'GET'); },
  getActivityLog(user_id) { return this.request('getActivityLog', { user_id }, 'GET'); },
  getReportsData(user_id) { return this.request('getReportsData', { user_id }, 'GET'); },
  getRecurringSchedules(user_id) { return this.request('getRecurringSchedules', { user_id }, 'GET'); },
  getHandovers(user_id) { return this.request('getHandovers', { user_id }, 'GET'); },
  getPersonalTodos(user_id) { return this.request('getPersonalTodos', { user_id }, 'GET'); },
  createTask(payload) { return this.request('createTask', payload, 'POST'); },
  acknowledgeTask(payload) { return this.request('acknowledgeTask', payload, 'POST'); },
  startTask(payload) { return this.request('startTask', payload, 'POST'); },
  markTaskDone(payload) { return this.request('markTaskDone', payload, 'POST'); },
  reopenTask(payload) { return this.request('reopenTask', payload, 'POST'); },
  requestDelay(payload) { return this.request('requestDelay', payload, 'POST'); },
  delegateTask(payload) { return this.request('delegateTask', payload, 'POST'); },
  createHandover(payload) { return this.request('createHandover', payload, 'POST'); },
  approveRequest(payload) { return this.request('approveRequest', payload, 'POST'); },
  rejectRequest(payload) { return this.request('rejectRequest', payload, 'POST'); },
  createTemplate(payload) { return this.request('createTemplate', payload, 'POST'); },
  updateTemplate(payload) { return this.request('updateTemplate', payload, 'POST'); },
  generateRecurringTasks(payload) { return this.request('generateRecurringTasks', payload, 'POST'); },
  createPersonalTodo(payload) { return this.request('createPersonalTodo', payload, 'POST'); },
  updatePersonalTodo(payload) { return this.request('updatePersonalTodo', payload, 'POST'); },
  acknowledgeHandover(payload) { return this.request('acknowledgeHandover', payload, 'POST'); }
};
