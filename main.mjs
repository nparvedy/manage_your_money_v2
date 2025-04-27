import { app, BrowserWindow, ipcMain, session, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './src/db.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

let mainWindow;

app.on('ready', async () => {
  await session.defaultSession.clearCache();

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')); // Charge le fichier généré par Vite
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'src', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')); // Charge le fichier généré par Vite
  }
});

// Gestionnaire pour mettre à jour la date limite
ipcMain.handle('money:setLimitDate', (event, newDate) => {
  db.prepare('UPDATE money SET limit_date = ?').run(newDate);
  const { total = 0 } = db.prepare(
    'SELECT SUM(amount) AS total FROM payment WHERE sampling_date <= ?'
  ).get(newDate);
  db.prepare('UPDATE money SET my_money = ?').run(total);
  return { success: true, balance: total };
});

// Gestionnaire pour récupérer tous les paiements
ipcMain.handle('payment:all', (event, limitDate) => {
  // Afficher les paiements jusqu'à la date limite, mais inclure aussi les deux mois précédents
  const dateObj = new Date(limitDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth(); // 0 = janvier

  // Premier jour du mois deux mois avant
  let startMonth = month - 2;
  let startYear = year;
  if (startMonth < 0) {
    startMonth += 12;
    startYear -= 1;
  }
  const startDate = new Date(startYear, startMonth, 1).toISOString().slice(0, 10);

  const payments = db.prepare(
    `SELECT * FROM payment WHERE sampling_date >= ? AND sampling_date <= ? ORDER BY sampling_date DESC`
  ).all(startDate, limitDate);
  return payments;
});

// Gestionnaire pour récupérer le solde actuel
ipcMain.handle('money:get', () => {
  const row = db.prepare('SELECT my_money FROM money LIMIT 1').get();
  return row ? row.my_money : 0;
});

// Gestionnaire pour récupérer la date limite actuelle
ipcMain.handle('money:getLimitDate', () => {
  const row = db.prepare('SELECT limit_date FROM money LIMIT 1').get();
  return row ? row.limit_date : null;
});

// Gestionnaire pour créer un paiement
ipcMain.handle('payment:create', (event, data) => {
  const { source, amount, sampling_date, nbr_month, pause } = {
    ...data,
    amount: parseFloat(data.amount),
    nbr_month: parseInt(data.months, 10),
  };

  const isValidDate = (date) => !isNaN(new Date(date).getTime());

  if (!isValidDate(sampling_date)) {
    throw new Error(`Invalid date value: ${sampling_date}`);
  }

  const insert = db.prepare(
    'INSERT INTO payment (source, amount, sampling_date, nbr_month, pause) VALUES (?, ?, ?, ?, ?)'
  );
  const ops = [];
  for (let i = 0; i < nbr_month; i++) {
    const date = new Date(sampling_date);
    date.setMonth(date.getMonth() + i);
    const iso = date.toISOString().slice(0, 10);
    const result = insert.run(source, amount, iso, nbr_month, pause ? 1 : 0);
    ops.push(result);
  }

  const { limit_date } = db.prepare('SELECT limit_date FROM money LIMIT 1').get();
  const balance = db.prepare(
    'SELECT SUM(amount) AS total FROM payment WHERE sampling_date <= ?'
  ).get(limit_date).total || 0;
  db.prepare('UPDATE money SET my_money = ?').run(balance);
  return { count: ops.length, balance };
});

// Gestionnaire pour supprimer un paiement
ipcMain.handle('payment:delete', (event, id) => {
  db.prepare('DELETE FROM payment WHERE id = ?').run(id);
  const { limit_date } = db.prepare('SELECT limit_date FROM money LIMIT 1').get();
  const balance = db.prepare(
    'SELECT SUM(amount) AS total FROM payment WHERE sampling_date <= ?'
  ).get(limit_date).total || 0;
  db.prepare('UPDATE money SET my_money = ?').run(balance);
  return { success: true, balance };
});

// Gestionnaire pour mettre à jour les paiements par source
ipcMain.handle('payment:updateBySource', (event, params) => {
  const { source, newAmount, startDate, endDate } = params;
  const stmt = db.prepare(
    'UPDATE payment SET amount = ? WHERE source = ? AND sampling_date BETWEEN ? AND ?'
  );
  const info = stmt.run(newAmount, source, startDate, endDate);
  const { limit_date } = db.prepare('SELECT limit_date FROM money LIMIT 1').get();
  const balance = db.prepare(
    'SELECT SUM(amount) AS total FROM payment WHERE sampling_date <= ?'
  ).get(limit_date).total || 0;
  db.prepare('UPDATE money SET my_money = ?').run(balance);
  return { changes: info.changes, balance };
});

// Gestionnaire pour mettre à jour un paiement existant
ipcMain.handle('payment:update', (event, data) => {
  if (!data.sampling_date || isNaN(new Date(data.sampling_date).getTime())) {
    throw new Error('Invalid or missing sampling_date');
  }

  db.prepare(
    'UPDATE payment SET source = ?, amount = ?, sampling_date = ?, nbr_month = ?, pause = ? WHERE id = ?'
  ).run(data.source, data.amount, data.sampling_date, data.nbr_month, data.pause ? 1 : 0, data.id);
  const { limit_date } = db.prepare('SELECT limit_date FROM money LIMIT 1').get();
  const balance = db.prepare(
    'SELECT SUM(amount) AS total FROM payment WHERE sampling_date <= ?'
  ).get(limit_date).total || 0;
  db.prepare('UPDATE money SET my_money = ?').run(balance);
  return { success: true, balance };
});

// Téléchargement de la base de données
ipcMain.handle('db:download', async () => {
  try {
    const dbPath = app.getPath('userData') + '/app.db';
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Enregistrer la base de données',
      defaultPath: `app_${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite DB', extensions: ['db'] }],
    });
    if (canceled || !filePath) return { success: false };
    fs.copyFileSync(dbPath, filePath);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
});

// Mise à jour de la base de données à partir d'un fichier sélectionné par l'utilisateur
ipcMain.handle('db:update', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Sélectionner un fichier de base de données',
      filters: [{ name: 'SQLite DB', extensions: ['db'] }],
      properties: ['openFile']
    });
    if (canceled || !filePaths || !filePaths[0]) return { success: false };
    const dbPath = app.getPath('userData') + '/app.db';
    fs.copyFileSync(filePaths[0], dbPath);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
});