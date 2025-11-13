const { ipcRenderer } = require('electron');
const adminList = document.getElementById('adminList');
const logoutBtn = document.getElementById('logoutBtn');

// Load all tickets for admin
async function loadAdminTickets() {
  const tickets = await ipcRenderer.invoke('fetch-tickets'); // admin sees all tickets
  renderAdminTickets(tickets);
}

// Render tickets
function renderAdminTickets(tickets) {
  adminList.innerHTML = '';
  if (!tickets || tickets.length === 0) {
    adminList.innerHTML = '<p>No reports available.</p>';
    return;
  }

  tickets.forEach(t => {
    const el = document.createElement('div');
    el.className = 'ticket';
    el.innerHTML = `
      <div><strong>#${t.id}</strong> • ${t.name || 'N/A'} (${t.department || 'N/A'}) • ${new Date(t.created_at).toLocaleString()}</div>
      <div><strong>Issue:</strong> ${escapeHtml(t.issue)}</div>
      <div>Priority: <strong>${t.priority}</strong> • Status:
        <select data-id="${t.id}" class="statusSelect">
          <option ${t.status==='Pending' ? 'selected' : ''}>Pending</option>
          <option ${t.status==='In Progress' ? 'selected' : ''}>In Progress</option>
          <option ${t.status==='Solved' ? 'selected' : ''}>Solved</option>
        </select>
      </div>
    `;
    adminList.appendChild(el);
  });

  // Update status on change
  document.querySelectorAll('.statusSelect').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = Number(e.target.dataset.id);
      const status = e.target.value;
      await ipcRenderer.invoke('update-status', { id, status });
      alert('Status updated!');
      loadAdminTickets();
    });
  });
}

// Escape HTML
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"']/g, m => ({'&':'&amp;','<':'&lt;','"':'&quot;',"'":'&#039;'})[m]);
}

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// Initial load
loadAdminTickets();
