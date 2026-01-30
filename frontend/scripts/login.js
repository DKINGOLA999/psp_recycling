document.getElementById('loginForm').addEventListener('submit', async e =>{
  e.preventDefault();
  const form = e.target;
  const data = { email: form.email.value, password: form.password.value };
  try{
    // basic validation
    if (!data.email || !data.password) throw { error: 'Email and password are required' };
    const res = await apiFetch('/public/login', { method: 'POST', body: data });
    const msgEl = document.getElementById('msg');
    if (msgEl) msgEl.textContent = res.message || 'Logged in';
    // Redirect: admin -> admin users page, user -> dashboard
    const role = res?.user?.role || 'user';
    if (role === 'admin') {
      window.location.href = 'admin_dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } catch(err){
    const msgEl = document.getElementById('msg');
    if (msgEl) msgEl.textContent = err?.error || err?.message || 'Login failed';
  }
});
