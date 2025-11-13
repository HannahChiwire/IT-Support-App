// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createTicket: (ticket) => ipcRenderer.invoke('create-ticket', ticket),
  fetchTickets: (filter) => ipcRenderer.invoke('fetch-tickets', filter),
  // send an object so main's handler ({ id, status }) receives it as expected
  updateStatus: (id, status) => ipcRenderer.invoke('update-status', { id, status }),
  // invoke the channel main.js listens for; accept optional role
  openAdmin: (role = 'admin') => ipcRenderer.invoke('open-dashboard', role)
});
