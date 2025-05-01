# Documentation des fonctionnalités de l'application

---

## Vue d'ensemble

L'application est structurée autour de trois grandes zones :
- **Sidebar** (menu latéral) : formulaire d'ajout/édition de paiement, gestion du solde, date limite, paramètres, export/import.
- **Tableau des paiements** (PaymentsTable) : affichage, recherche, filtrage, édition et suppression des paiements.
- **Graphiques** (Charts) : visualisation de l'évolution du solde, répartition par source et catégorie, recettes/dépenses.

---

## 1. Sidebar (src/components/Sidebar.jsx)

### Formulaire d'ajout/édition de paiement
- **onSubmit(formData: Object)**
  - Ajoute ou modifie un paiement.
  - Paramètres :
    - `id` (string|number, optionnel) : identifiant du paiement (pour édition)
    - `source` (string) : nom de la source
    - `amount` (number) : montant
    - `sampling_date` (string, format YYYY-MM-DD) : date du paiement
    - `months` (string|number) : nombre de mois (paiement récurrent)
    - `pause` (boolean) : paiement en pause ou non
    - `category` (string) : catégorie du paiement
- **Auto-complétion sur le champ source**
  - Suggestions dynamiques selon les sources déjà existantes (via `window.api.getSources()`).

### Gestion du solde et de la date limite
- **Solde affiché** : récupéré via `window.api.getBalance()`
- **Date limite** : modifiable, impacte les paiements affichés et le solde (`window.api.setLimitDate(date)`, `window.api.getLimitDate()`)
- **Montant limite** : budget à ne pas dépasser (`window.api.getLimitAmount()`, `window.api.setLimitAmount(value)`).
- **Calcul du montant restant avant la limite** : différence entre le solde à la date limite et le montant limite.
- **Alerte de dépassement** : affichage d'une alerte si le solde passe sous la limite, avec date de retour au-dessus de la limite.
- **Répartition du budget** : calcul automatique du budget max par jour/semaine jusqu'à la prochaine rentrée d'argent ou la date limite.

### Paramètres et actions avancées
- **Téléchargement de la base de données** : `window.api.dbDownload()`
- **Mise à jour de la base de données** : `window.api.dbUpdate()`
- **Export des paiements** : PDF ou CSV, sur une période donnée (`window.api.exportPayments({start, end, format})`)

---

## 2. Tableau des paiements (src/components/PaymentsTable.jsx)

### Affichage et filtrage
- **Affichage des paiements** : groupés par mois, code couleur selon catégorie et type (entrée/sortie).
- **Filtres avancés** :
  - Recherche par source (texte)
  - Filtre par montant min/max
  - Filtre par date de début/fin
- **Réinitialisation des filtres**

### Actions sur les paiements
- **Édition** : bouton crayon, ouvre le formulaire d'édition dans la Sidebar (`onEdit(id)`)
- **Suppression** : bouton corbeille, modale de confirmation (`onDelete(id)`)
- **Gestion des paiements récurrents** :
  - Si un paiement fait partie d'une série (unique_id, nbr_month > 1), choix de modifier/supprimer un seul ou tous les paiements liés (`window.api.updateByUniqueId`, `window.api.deleteByUniqueId`)

---

## 3. Graphiques (src/components/Charts.jsx)

### Visualisations disponibles
- **Évolution du solde** : courbe du solde cumulé sur la période sélectionnée
- **Répartition par source** : histogramme horizontal des montants par source
- **Recettes vs Dépenses** : camembert recettes/dépenses
- **Répartition par catégorie** : camembert des montants par catégorie
- **Plage de dates personnalisable**

---

## 4. API exposée via preload.js (window.api)

| Fonction                | Description | Paramètres |
|------------------------ |------------ |------------|
| createPayment(data)     | Ajoute un paiement | data: objet (voir formulaire)
| getPayments(limitDate)  | Liste des paiements jusqu'à la date limite | limitDate: string (YYYY-MM-DD)
| updatePayment(data)     | Modifie un paiement | data: objet (voir formulaire)
| deletePayment(id)       | Supprime un paiement | id: number|string
| updateBySource(params)  | Modifie tous les paiements d'une source sur une période | params: {source, newAmount, startDate, endDate}
| updateByUniqueId(params)| Modifie tous les paiements liés à un unique_id | params: {unique_id, ...}
| deleteByUniqueId(id)    | Supprime tous les paiements liés à un unique_id | unique_id: string
| getBalance()            | Récupère le solde actuel | -
| getBalanceAt(date)      | Solde à une date donnée | date: string (YYYY-MM-DD)
| getLimitDate()          | Récupère la date limite | -
| setLimitDate(date)      | Définit la date limite | date: string (YYYY-MM-DD)
| getLimitAmount()        | Récupère le montant limite | -
| setLimitAmount(value)   | Définit le montant limite | value: number
| dbDownload()            | Télécharge la base de données | -
| dbUpdate()              | Met à jour la base de données | -
| exportPayments(params)  | Exporte les paiements (PDF/CSV) | params: {start, end, format}
| getSources()            | Liste des sources existantes | -
| getFuturePayments(date) | Liste des paiements futurs à partir d'une date | fromDate: string (YYYY-MM-DD)
| getFirstPaymentDate()   | Date du premier paiement | -

---

## 5. Résumé par page

- **Page principale (App.jsx)**
  - Affiche Sidebar, Tableau des paiements, Graphiques
  - Gère le rafraîchissement global des données
- **Sidebar**
  - Ajout/édition de paiement, gestion du solde, date limite, export/import, budget
- **Tableau des paiements**
  - Affichage, recherche, filtres, édition/suppression, gestion des paiements récurrents
- **Graphiques**
  - Visualisation de l'évolution du solde, répartition par source/catégorie, recettes/dépenses

---

Pour chaque fonction, voir la section API ci-dessus pour le détail des paramètres et leur type.
