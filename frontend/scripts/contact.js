document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const msgEl = document.getElementById('msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.textContent = '';
    try {
      const payload = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim(),
      };

      if (!payload.message) {
        msgEl.className = 'text-danger';
        msgEl.textContent = 'Please enter a message.';
        return;
      }

      const res = await apiFetch('/public/contact', { method: 'POST', body: payload });
      msgEl.className = 'text-success';
      msgEl.textContent = res.message || 'Message sent.';
      form.reset();
    } catch (err) {
      msgEl.className = 'text-danger';
      msgEl.textContent = err?.error || err?.message || 'Failed to send message.';
    }
  });
});
