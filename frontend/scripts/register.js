document.getElementById('registerForm').addEventListener('submit', async e =>{
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    password: f.password.value,
    houseNumber: f.houseNumber.value.trim(),
    street: f.street.value.trim(),
    state: f.state.value.trim(),
    country: f.country.value.trim()
  };
  // include userType
  data.userType = f.userType.value;
  // basic client-side validation
  if (!data.name || !data.email || !data.password || data.password.length < 6) {
    document.getElementById('msg').textContent = 'Please complete all fields and use a password of at least 6 characters';
    return;
  }
  try{
    const res = await apiFetch('/public/register', { method: 'POST', body: data });
    document.getElementById('msg').textContent = res.message || 'Registered successfully';
    window.location.href = '/login.html';
  } catch(err){
    document.getElementById('msg').textContent = err?.message || err?.error || 'Registration failed';
  }
});
