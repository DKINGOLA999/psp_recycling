document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('pickupForm');
  const msgEl = document.getElementById('msg');

  // Optionally prefill name/email from /user/profile
  (async function prefill(){
    try {
      const res = await apiFetch('/user/profile');
      if (res && res.user) {
        if (!document.getElementById('name').value) document.getElementById('name').value = res.user.name || '';
        if (!document.getElementById('email').value) document.getElementById('email').value = res.user.email || '';
      }
    } catch(e){ /* silent when not logged in */ }
  })();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.textContent = '';
    msgEl.className = '';

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      date: document.getElementById('date').value,
      wasteType: document.getElementById('wasteType').value,
      note: document.getElementById('note').value.trim(),
    };

    if (!payload.name || !payload.date || !payload.wasteType) {
      msgEl.className = 'text-danger';
      msgEl.textContent = 'Please provide your name, a date, and the waste type.';
      return;
    }

    try {
      const res = await apiFetch('/pickups', { method: 'POST', body: payload });
      msgEl.className = 'text-success';
      msgEl.textContent = res.message || 'Pickup requested successfully.';
      form.reset();
      // Optionally redirect to dashboard or show more info
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 1200);
    } catch (err) {
      msgEl.className = 'text-danger';
      msgEl.textContent = err?.error || err?.message || 'Failed to request pickup.';
    }
  });
});
