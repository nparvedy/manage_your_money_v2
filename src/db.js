import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Chemin vers la base de données dans le répertoire userData d'Electron
const dbPath = path.join(app.getPath('userData'), 'app.db');
const db = new Database(dbPath);

// Initialisation des tables
const initDB = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS money (
      my_money DECIMAL,
      limit_date DATE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS payment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      amount DECIMAL,
      sampling_date DATE,
      nbr_month INTEGER,
      pause BOOLEAN
    )
  `).run();

  // Insérer une ligne initiale dans la table money si elle est vide
  const count = db.prepare('SELECT COUNT(*) AS c FROM money').get().c;
  if (count === 0) {
    db.prepare(`INSERT INTO money(my_money, limit_date) VALUES (?, date('now','localtime'))`).run(0);
  }
};

initDB();

export default db;