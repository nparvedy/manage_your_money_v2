<!--
README généré automatiquement le 27 avril 2025
-->

# 💸 ManageYourMoney

**Gérez vos paiements, suivez votre solde, et gardez le contrôle sur vos finances personnelles, simplement et efficacement !**

téléchargement : https://www.dropbox.com/scl/fi/9my5lajs0f6synwhekd4s/ManageYourMoney-Setup-1.0.2.exe?rlkey=pbzzwkfqppsi6saoi0s2grm74&st=gjn3fmpa&dl=0
---

## 🚀 Présentation

**ManageYourMoney** est une application de bureau moderne, rapide et sécurisée, conçue pour t’aider à suivre tous tes paiements, visualiser ton solde en temps réel, et manipuler ta base de données en toute simplicité. Elle s’appuie sur les technologies Electron, React, Vite et SQLite pour offrir une expérience fluide et performante.

---

## ✨ Fonctionnalités principales

- **Ajout, modification et suppression de paiements**  
  Gérez vos entrées et sorties d’argent, avec la possibilité de programmer des paiements récurrents sur plusieurs mois.

- **Tableau de bord interactif**  
  Visualisez tous vos paiements, regroupés par mois, avec des totaux mensuels et un code couleur pour les entrées (vert) et sorties (rouge).

- **Solde dynamique**  
  Le solde s’affiche en vert s’il est positif, en rouge s’il est négatif, et se met à jour automatiquement selon la date limite choisie.

- **Gestion de la date limite**  
  Filtrez vos paiements jusqu’à une date donnée, tout en affichant automatiquement les deux mois précédents pour une meilleure visibilité.

- **Téléchargement & mise à jour de la base de données**  
  Exportez votre base SQLite en un clic, ou remplacez-la facilement par une sauvegarde existante.

- **Modales de confirmation et d’information**  
  Toutes les actions importantes (suppression, import/export, erreurs) sont confirmées par des modales élégantes, pour une expérience utilisateur sans stress.

- **Interface moderne et responsive**  
  Utilisation de TailwindCSS pour un design épuré, agréable et adapté à tous les écrans.

---

## 🖥️ Pourquoi utiliser cette application ?

- **Sécurité & confidentialité** : Vos données restent sur votre ordinateur, dans une base SQLite locale.
- **Simplicité** : Pas besoin de compte, pas de cloud, tout est accessible en un clic.
- **Puissance** : Ajoutez, modifiez, supprimez, filtrez, exportez, importez… tout est possible, même en masse !
- **Adaptée à tous** : Que vous soyez particulier, indépendant ou petite association, ManageYourMoney s’adapte à vos besoins.

---

## 🛠️ Architecture technique

- **Electron** : Fournit l’environnement desktop sécurisé et l’accès au système de fichiers.
- **React + Vite** : Pour une interface ultra-rapide et réactive.
- **SQLite (better-sqlite3)** : Stockage local robuste et performant.
- **TailwindCSS** : Pour un style moderne et personnalisable.

---

## 🗂️ Structure du projet

```
├── main.mjs           # Processus principal Electron (gestion fenêtres, IPC, accès DB)
├── src/
│   ├── App.jsx        # Composant principal React
│   ├── components/
│   │   ├── Sidebar.jsx        # Formulaire d’ajout, menu paramètres, solde, date limite
│   │   └── PaymentsTable.jsx  # Tableau des paiements, modale suppression
│   ├── db.js          # Initialisation et accès à la base SQLite
│   ├── preload.js     # Bridge sécurisé entre Electron et React (API)
│   └── main.jsx       # Point d’entrée React
├── public/            # Assets statiques
├── index.html         # Fichier HTML principal
├── package.json       # Dépendances et scripts
└── ...                # Configs, styles, etc.
```

---

## 🧩 Détail des fonctionnalités

### ➕ Ajouter un paiement
- Saisie du montant, source, date (par défaut aujourd’hui), nombre de mois (par défaut 1).
- Paiement récurrent possible (répété sur plusieurs mois).

### 📝 Modifier ou supprimer un paiement
- Icône crayon pour éditer, corbeille pour supprimer (avec modale de confirmation).

### 📅 Filtrer par date limite
- Choisissez une date limite : seuls les paiements jusqu’à cette date (et les deux mois précédents) sont affichés.

### 💾 Exporter / Importer la base
- Depuis le menu “rouage” (paramètres), téléchargez la base ou remplacez-la par une sauvegarde.
- Idéal pour les sauvegardes, migrations ou restaurations.

### 🧮 Solde en temps réel
- Calcul automatique du solde selon la date limite et les paiements affichés.

### 🛡️ Sécurité & UX
- Toutes les actions sensibles sont confirmées par des modales.
- Les erreurs sont affichées de façon claire et non bloquante.

---

## 🎯 Pour qui ?

- **Particuliers** : Suivi de budget, gestion des abonnements, contrôle des dépenses.
- **Indépendants** : Suivi des factures, rentrées et sorties d’argent.
- **Associations** : Gestion simple de la trésorerie.

---

## 📦 Installation & lancement

1. **Installer les dépendances**  
   ```bash
   npm install
   ```
2. **Lancer l’application**  
   ```bash
   npm run start:electron
   ```

---

## 🖼️ Aperçu

> ![Aperçu de l’application](public/vite.svg)  
> *Interface moderne, claire et intuitive !*

---

## ❤️ Pourquoi choisir ManageYourMoney ?

- **Open source** et personnalisable
- **Ultra-rapide** grâce à Vite & React
- **Aucune dépendance cloud** : vos données restent chez vous
- **Fonctionnalités avancées** (import/export, édition en masse, etc.)

---

**Gérez vos finances simplement, efficacement, et en toute sécurité avec ManageYourMoney !**

---