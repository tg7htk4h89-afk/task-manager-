window.Auth = (() => {
  const key = window.APP_CONFIG.authStorageKey;

  function saveSession(user) {
    sessionStorage.setItem(key, JSON.stringify({ user_id: user.user_id, full_name: user.full_name, role: user.role }));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(key) || 'null');
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    sessionStorage.removeItem(key);
  }

  function requireAuth() {
    const session = getSession();
    if (!session?.user_id) {
      redirectToLogin();
      return null;
    }
    return session;
  }

  function redirectToLogin() {
    const prefix = location.pathname.includes('/pages/') ? '../' : './';
    location.href = `${prefix}index.html`;
  }

  async function hydrateCurrentUser() {
    const session = requireAuth();
    if (!session) return null;
    const response = await Api.getCurrentUser(session.user_id);
    if (!response.success) {
      clearSession();
      redirectToLogin();
      throw new Error(response.error || 'Failed to load current user');
    }
    window.Store.currentUser = response.data;
    return response.data;
  }

  return { saveSession, getSession, clearSession, requireAuth, redirectToLogin, hydrateCurrentUser };
})();
