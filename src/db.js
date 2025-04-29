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
      pause BOOLEAN,
      category TEXT
    )
  `).run();

  // Migration : ajout colonne category si manquante
  const pragma = db.prepare("PRAGMA table_info(payment)").all();
  if (!pragma.some(col => col.name === 'category')) {
    db.prepare('ALTER TABLE payment ADD COLUMN category TEXT').run();
  }

  // Migration : ajout colonne unique_id si manquante
  if (!pragma.some(col => col.name === 'unique_id')) {
    db.prepare('ALTER TABLE payment ADD COLUMN unique_id TEXT').run();
  }

  // Migration : ajout colonne limit_amount si manquante
  const pragmaMoney = db.prepare("PRAGMA table_info(money)").all();
  if (!pragmaMoney.some(col => col.name === 'limit_amount')) {
    db.prepare('ALTER TABLE money ADD COLUMN limit_amount DECIMAL DEFAULT 0').run();
    db.prepare('UPDATE money SET limit_amount = 0').run();
  }

  // Insérer une ligne initiale dans la table money si elle est vide
  const count = db.prepare('SELECT COUNT(*) AS c FROM money').get().c;
  if (count === 0) {
    db.prepare(`INSERT INTO money(my_money, limit_date) VALUES (?, date('now','localtime'))`).run(0);
  }
};

initDB();

export default db;