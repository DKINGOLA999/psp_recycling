document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#pickupsTable tbody');
  const msgEl = document.getElementById('msg');

  async function loadPickups(){
    try {
      const res = await apiFetch('/admin/pickups');
      const pickups = res.pickups || [];
      tableBody.innerHTML = '';
      pickups.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p._id}</td>
          <td>${p.name || ''}${p.email? '<div class="small muted">'+p.email+'</div>':''}</td>
          <td>${new Date(p.date).toLocaleDateString()}</td>
          <td>${p.wasteType}</td>
          <td>${p.note || ''}</td>
          <td>${p.status}</td>
          <td>
            <select class="form-select form-select-sm status-select" data-id="${p._id}">
              <option ${p.status==='requested'?'selected':''} value="requested">requested</option>
              <option ${p.status==='scheduled'?'selected':''} value="scheduled">scheduled</option>
              <option ${p.status==='completed'?'selected':''} value="completed">completed</option>
              <option ${p.status==='cancelled'?'selected':''} value="cancelled">cancelled</option>
            </select>
            <button class="btn btn-sm btn-primary mt-1 update-btn" data-id="${p._id}">Update</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      // attach listeners
      document.querySelectorAll('.update-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const sel = document.querySelector(`.status-select[data-id="${id}"]`);
          const status = sel.value;
          try {
            await apiFetch(`/admin/pickups/${id}/status`, { method: 'POST', body: { status } });
            msgEl.className = 'text-success';
            msgEl.textContent = 'Status updated';
            loadPickups();
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
      tableBody.innerHTML = '<tr><td colspan="7">Failed to load pickups</td></tr>';
    }
  }

  loadPickups();
});
