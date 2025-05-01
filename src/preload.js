const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  createPayment: (data) => ipcRenderer.invoke('payment:create', data),
  getPayments: (limitDate) => {
    return ipcRenderer.invoke('payment:all', limitDate);
  },
  updatePayment: (data) => ipcRenderer.invoke('payment:update', data),
  deletePayment: (id) => ipcRenderer.invoke('payment:delete', id),
  updateBySource: (params) => ipcRenderer.invoke('payment:updateBySource', params),
  updateByUniqueId: (params) => ipcRenderer.invoke('payment:updateByUniqueId', params),
  deleteByUniqueId: (unique_id) => ipcRenderer.invoke('payment:deleteByUniqueId', unique_id),
  getBalance: () => ipcRenderer.invoke('money:get'),
  getBalanceAt: (date) => ipcRenderer.invoke('money:getBalanceAt', date),
  getLimitDate: () => ipcRenderer.invoke('money:getLimitDate'),
  setLimitDate: (date) => ipcRenderer.invoke('money:setLimitDate', date),
  getLimitAmount: () => ipcRenderer.invoke('money:getLimitAmount'),
  setLimitAmount: (value) => ipcRenderer.invoke('money:setLimitAmount', value),
  dbDownload: () => ipcRenderer.invoke('db:download'),
  dbUpdate: () => ipcRenderer.invoke('db:update'),
  exportPayments: (params) => ipcRenderer.invoke('payments:export', params),
  getSources: () => ipcRenderer.invoke('payment:getSources'),
  getFuturePayments: (fromDate) => ipcRenderer.invoke('payment:future', fromDate),
  getFirstPaymentDate: () => ipcRenderer.invoke('payment:getFirstDate'),
  uploadAttachment: async (file) => {
    if (!file) return { path: '' };
    // Lire le fichier en buffer côté renderer
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target.result;
        const result = await ipcRenderer.invoke('attachment:upload', {
          name: file.name,
          buffer: Array.from(new Uint8Array(buffer)),
        });
        resolve(result);
      };
      reader.readAsArrayBuffer(file);
    });
  },
});