import { app, BrowserWindow, ipcMain, session, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './src/db.js';
import PDFDocument from 'pdfkit';
import { Parser as CsvParser } from 'json2csv';

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
  const { source, amount, sampling_date, nbr_month, pause, category } = {
    ...data,
    amount: parseFloat(data.amount),
    nbr_month: parseInt(data.months, 10),
  };

  const isValidDate = (date) => !isNaN(new Date(date).getTime());

  if (!isValidDate(sampling_date)) {
    throw new Error(`Invalid date value: ${sampling_date}`);
  }

  const insert = db.prepare(
    'INSERT INTO payment (source, amount, sampling_date, nbr_month, pause, category) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const ops = [];
  for (let i = 0; i < nbr_month; i++) {
    const date = new Date(sampling_date);
    date.setMonth(date.getMonth() + i);
    const iso = date.toISOString().slice(0, 10);
    const result = insert.run(source, amount, iso, nbr_month, pause ? 1 : 0, category || '');
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
    'UPDATE payment SET source = ?, amount = ?, sampling_date = ?, nbr_month = ?, pause = ?, category = ? WHERE id = ?'
  ).run(data.source, data.amount, data.sampling_date, data.nbr_month, data.pause ? 1 : 0, data.category || '', data.id);
  const { limit_date } = db.prepare('SELECT limit_date FROM money LIMIT 1').get();
  const balance = db.prepare(
    'SELECT SUM(amount) AS total FROM payment WHERE sampling_date <= ?'
  ).get(limit_date).total || 0;
  db.prepare('UPDATE money SET my_money = ?').run(balance);
  return { success: true, balance };
});

// Gestionnaire pour récupérer toutes les sources distinctes (auto-complétion)
ipcMain.handle('payment:getSources', () => {
  const rows = db.prepare("SELECT DISTINCT source FROM payment WHERE source IS NOT NULL AND source != ''").all();
  return rows.map(r => r.source);
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

// Export PDF/CSV des paiements
ipcMain.handle('payments:export', async (event, { start, end, format }) => {
  try {
    // Récupérer les paiements dans la période
    const payments = db.prepare(
      'SELECT * FROM payment WHERE sampling_date >= ? AND sampling_date <= ? ORDER BY sampling_date ASC'
    ).all(start, end);
    if (!payments.length) return { success: false };

    // Demander où sauvegarder le fichier
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: `Exporter les paiements (${format.toUpperCase()})`,
      defaultPath: `paiements_${start}_au_${end}.${format}`,
      filters: [
        format === 'pdf'
          ? { name: 'PDF', extensions: ['pdf'] }
          : { name: 'CSV', extensions: ['csv'] },
      ],
    });
    if (canceled || !filePath) return { success: false };

    if (format === 'pdf') {
      // Générer le PDF avec un tableau aligné (fixe la position X pour chaque colonne)
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(fs.createWriteStream(filePath));
      // Titre
      doc.fontSize(18).fillColor('#2d3748').text(`Liste des paiements du ${start} au ${end}`, { align: 'center', underline: true });
      doc.moveDown(1.5);
      // En-têtes du tableau
      const headers = ['Date', 'Source', 'Montant (€)', 'Mois'];
      const colWidths = [90, 180, 90, 60];
      const tableTop = doc.y;
      const startX = doc.x;
      // En-tête
      doc.fontSize(12).fillColor('#fff').font('Helvetica-Bold');
      let x = startX;
      headers.forEach((header, i) => {
        doc.rect(x, tableTop, colWidths[i], 24).fillAndStroke('#6366f1', '#6366f1');
        doc.fillColor('#fff').text(header, x + 8, tableTop + 6, { width: colWidths[i] - 16, align: 'left' });
        x += colWidths[i];
      });
      // Lignes du tableau
      let y = tableTop + 24;
      doc.font('Helvetica');
      payments.forEach((p, idx) => {
        x = startX;
        const bgColor = idx % 2 === 0 ? '#f1f5f9' : '#fff';
        // Date
        doc.rect(x, y, colWidths[0], 22).fillAndStroke(bgColor, '#e5e7eb');
        doc.fillColor('#222').text(p.sampling_date, x + 8, y + 6, { width: colWidths[0] - 16, align: 'left' });
        x += colWidths[0];
        // Source
        doc.rect(x, y, colWidths[1], 22).fillAndStroke(bgColor, '#e5e7eb');
        doc.fillColor('#222').text(p.source, x + 8, y + 6, { width: colWidths[1] - 16, align: 'left' });
        x += colWidths[1];
        // Montant
        doc.rect(x, y, colWidths[2], 22).fillAndStroke(bgColor, '#e5e7eb');
        doc.fillColor(p.amount >= 0 ? '#059669' : '#dc2626').text(p.amount.toFixed(2), x + 8, y + 6, { width: colWidths[2] - 16, align: 'right' });
        x += colWidths[2];
        // Mois
        doc.rect(x, y, colWidths[3], 22).fillAndStroke(bgColor, '#e5e7eb');
        doc.fillColor('#222').text(p.nbr_month, x + 8, y + 6, { width: colWidths[3] - 16, align: 'center' });
        y += 22;
        // Saut de page si besoin
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = doc.y;
        }
      });
      doc.end();
    } else {
      // Générer le CSV
      const parser = new CsvParser();
      const csv = parser.parse(payments);
      fs.writeFileSync(filePath, csv, 'utf8');
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
});