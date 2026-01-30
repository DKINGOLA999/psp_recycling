document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#contactsTable tbody');
  const msgEl = document.getElementById('msg');

  async function loadContacts(){
    try {
      const res = await apiFetch('/admin/contacts');
      const contacts = res.contacts || [];
      tableBody.innerHTML = '';
      contacts.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${c._id}</td>
          <td>${c.name || 'Anonymous'}<div class="small muted">${c.email || ''}</div></td>
          <td>${c.subject || '-'}</td>
          <td style="max-width:360px; white-space:pre-wrap;">${(c.message || '').slice(0, 250)}${(c.message||'').length>250? '...':''}</td>
          <td>${new Date(c.createdAt).toLocaleString()}</td>
          <td>${c.status}</td>
          <td>
            <select class="form-select form-select-sm status-select" data-id="${c._id}">
              <option ${c.status==='open'?'selected':''} value="open">open</option>
              <option ${c.status==='pending'?'selected':''} value="pending">pending</option>
              <option ${c.status==='closed'?'selected':''} value="closed">closed</option>
            </select>
            <button class="btn btn-sm btn-primary mt-1 update-btn" data-id="${c._id}">Update</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      document.querySelectorAll('.update-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const sel = document.querySelector(`.status-select[data-id="${id}"]`);
          const status = sel.value;
          try {
            await apiFetch(`/admin/contacts/${id}/status`, { method: 'POST', body: { status } });
            msgEl.className = 'text-success';
            msgEl.textContent = 'Status updated';
            loadContacts();
          } catch (err) {
            msgEl.className = 'text-danger';
            msgEl.textContent = err?.error || err?.message || 'Failed';
          }
        });
      });
    } catch (err) {
      if (err && (err.error === 'Unauthorized' || err.error === 'Unauthorized: please log in')) {
        window.location.href = '/login.html';
        return;
      }
      tableBody.innerHTML = '<tr><td colspan="7">Failed to load contacts</td></tr>';
    }
  }

  loadContacts();
});
