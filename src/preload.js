const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  createPayment: (data) => ipcRenderer.invoke('payment:create', data),
  getPayments: (limitDate) => {
    return ipcRenderer.invoke('payment:all', limitDate);
  },
  updatePayment: (data) => ipcRenderer.invoke('payment:update', data),
  deletePayment: (id) => ipcRenderer.invoke('payment:delete', id),
  updateBySource: (params) => ipcRenderer.invoke('payment:updateBySource', params),
  getBalance: () => ipcRenderer.invoke('money:get'),
  getLimitDate: () => ipcRenderer.invoke('money:getLimitDate'),
  setLimitDate: (date) => ipcRenderer.invoke('money:setLimitDate', date),
  dbDownload: () => ipcRenderer.invoke('db:download'),
  dbUpdate: () => ipcRenderer.invoke('db:update'),
  exportPayments: (params) => ipcRenderer.invoke('payments:export', params),
  getSources: () => ipcRenderer.invoke('payment:getSources'),
});