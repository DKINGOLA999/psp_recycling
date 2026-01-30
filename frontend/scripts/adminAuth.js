(async function(){
  // guard admin pages: fetch profile and ensure role === 'admin'
  try {
    if (typeof window.apiFetch !== 'function') {
      // Ensure apiFetch is available by loading scripts in correct order
      console.warn('adminAuth: apiFetch not available');
      return;
    }
    const res = await window.apiFetch('/user/profile');
    const role = res?.user?.role;
    if (role !== 'admin') {
      // Not an admin — send to login so they can sign in as admin
      window.location.href = '/login.html';
    }
  } catch (err) {
    // Not authenticated or error — go to login
    try { window.location.href = '/login.html'; } catch(e){}
  }
})();
