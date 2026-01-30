async function loadProfile(){
  try{
    const res = await apiFetch('/user/profile');
    const user = res.user;
    // render user info as HTML so it displays clearly on the page
    const parts = [];
    parts.push(`<p><strong>Name:</strong> ${user.name || ''}</p>`);
    parts.push(`<p><strong>Email:</strong> ${user.email || ''}</p>`);
    if (user.account) parts.push(`<p><strong>Account:</strong> ${user.account}</p>`);
    const addr = [user.houseNumber, user.street, user.state, user.country].filter(Boolean).join(', ');
    if (addr) parts.push(`<p><strong>Address:</strong> ${addr}</p>`);
    if (typeof user.outstanding !== 'undefined') parts.push(`<p><strong>Outstanding:</strong> ${user.outstanding}</p>`);
    document.getElementById('profile').innerHTML = parts.join('');
    // populate edit form
    const f = document.getElementById('editForm');
    f.name.value = user.name || '';
    f.email.value = user.email || '';
    f.dataset.userid = user._id || user.id || '';
  } catch(err){
    const el = document.getElementById('profile');
    const msg = err?.error || err?.message || JSON.stringify(err) || 'Not logged in or error';
    if (el) el.textContent = msg;
    console.error('Profile load error:', err);
  }
}

loadProfile();

document.getElementById('editForm').addEventListener('submit', async e =>{
  e.preventDefault();
  const f = e.target;
  const userId = f.dataset.userid;
  const payload = {};
  if(f.name.value) payload.name = f.name.value;
  if(f.email.value) payload.email = f.email.value;
  if(f.password.value) payload.password = f.password.value;
  try{
    const res = await apiFetch(`/user/profile/${userId}`, { method: 'PUT', body: payload });
    document.getElementById('msg').textContent = 'Profile updated';
    loadProfile();
  } catch(err){
    document.getElementById('msg').textContent = err?.error || 'Update failed';
  }
});
