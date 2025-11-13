// user.js
const form = document.getElementById('ticketForm');
const list = document.getElementById('ticketsList');
const openAdminBtn = document.getElementById('openAdmin');

function determinePriority(issueText) {
  const text = (issueText || '').toLowerCase();
  const high = ['urgent', 'down', 'failure', "can't", 'cannot', 'not working', 'error', 'critical', 'unable', 'crash', 'data loss'];
  const medium = ['slow', 'delay', 'intermittent', 'performance', 'lag', 'warning'];
  if (high.some(k => text.includes(k))) return 'High';
  if (medium.some(k => text.includes(k))) return 'Medium';
  return 'Low';
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[&<"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','"':'&quot;',"'":'&#039;'})[m];
  });
}

async function loadTickets() {
  let tickets = await window.electronAPI.fetchTickets();
  // normalize possible shapes
  if (!Array.isArray(tickets)) {
    if (tickets && Array.isArray(tickets.data)) tickets = tickets.data;
    else tickets = tickets || [];
  }
  renderTickets(tickets);
}

function renderTickets(tickets = []) {
  if (!list) return;
  list.innerHTML = '';
  tickets.forEach(t => {
    const safeIssue = escapeHtml(t.issue);
    const priorityClass = (t.priority || '').toLowerCase();
    const statusClass = (t.status || '').replace(/\s+/g, '-').toLowerCase();
    const el = document.createElement('div');
    el.className = `ticket priority-${priorityClass} status-${statusClass}`;
    el.innerHTML = `
      <div class="meta"><strong>#${t.id}</strong> • ${escapeHtml(t.name || '')} (${escapeHtml(t.department || '')}) • ${t.created_at ? new Date(t.created_at).toLocaleString() : ''}</div>
      <div class="issue">${safeIssue}</div>
      <div class="meta">Priority: <strong>${escapeHtml(t.priority || 'N/A')}</strong> • Status: <strong>${escapeHtml(t.status || 'Pending')}</strong></div>
    `;
    list.appendChild(el);
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('name') || {}).value?.trim() || '';
    const department = (document.getElementById('department') || {}).value?.trim() || '';
    const issue = (document.getElementById('issue') || {}).value?.trim() || '';

    if (!name || !department || !issue) { alert('Please fill all fields'); return; }

    // System determines the priority
    const priority = determinePriority(issue);

    const result = await window.electronAPI.createTicket({ name, department, issue, priority });

    // handle response shape { success, id } from main
    if (result && result.success) {
      alert('Ticket submitted. ID: ' + result.id + ' (Priority: ' + priority + ')');
      form.reset();
      loadTickets();
    } else {
      alert('Error submitting ticket: ' + (result && result.message ? result.message : 'Unknown error'));
    }
  });
}

if (openAdminBtn) {
  openAdminBtn.addEventListener('click', () => {
    if (window.electronAPI && typeof window.electronAPI.openAdmin === 'function') {
      window.electronAPI.openAdmin();
    }
  });
}

// initial load
loadTickets();
