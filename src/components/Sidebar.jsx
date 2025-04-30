import React, { useState, useEffect } from 'react';
import { FiSettings } from 'react-icons/fi';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

// Palette d'icônes pour chaque catégorie
const categoryIcons = {
  'Loyer': '🏠',
  'Alimentation': '🛒',
  'Loisirs': '🎉',
  'Transports': '🚗',
  'Santé': '💊',
  'Abonnements': '📺',
  'Impôts': '💸',
  'Divers': '🧩',
  'Salaires': '💼',
  'Crédit': '🏦',
};

const Sidebar = ({ onSubmit, onCancel, onSetLimit, balance, limitDate, editingPayment, refreshAll }) => {
  const [formData, setFormData] = useState({
    id: '',
    source: '',
    amount: '',
    sampling_date: '',
    months: '',
    pause: false,
    category: '',
  });

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchData, setBatchData] = useState({
    batchSource: '',
    batchAmount: '',
    batchStart: '',
    batchEnd: '',
  });

  const [showSettings, setShowSettings] = useState(false);
  const [infoModal, setInfoModal] = useState({ show: false, message: '', type: 'success' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState('pdf');

  const [allSources, setAllSources] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modale pour édition en masse ou non
  const [editMassModal, setEditMassModal] = useState({ show: false, formData: null });

  // Montant limite (budget à ne pas dépasser)
  const [limitAmount, setLimitAmount] = useState(0);
  const [limitAmountInput, setLimitAmountInput] = useState('');
  const [limitAlert, setLimitAlert] = useState('');
  const [paymentsPreview, setPaymentsPreview] = useState([]);

  useEffect(() => {
    // Charger toutes les sources existantes au montage
    window.api.getSources().then((sources) => {
      setAllSources(sources || []);
    });
  }, []);

  // Charger le montant limite au montage
  useEffect(() => {
    window.api.getLimitAmount().then((v) => {
      setLimitAmount(Number(v) || 0);
      setLimitAmountInput(String(v || ''));
    });
  }, []);

  // Charger les paiements pour prévision (à partir d'aujourd'hui, sur 1 an)
  useEffect(() => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    window.api.getFuturePayments(todayIso).then((p) => setPaymentsPreview(p || []));
    // Afficher le solde actuel d'aujourd'hui dans la console
  }, [limitDate, balance]);

  // Calcul du jour où le solde passe sous le montant limite (en partant du solde réel d'aujourd'hui)
  useEffect(() => {
    if (limitAmount === undefined || limitAmount === null || !paymentsPreview.length) {
      setLimitAlert('');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    // Calculer la date d'hier
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().slice(0, 10);
    window.api.getBalanceAt(yesterdayIso).then((soldeInitial) => {
      // Récupérer tous les paiements à venir (jusqu'à 60 jours)
      window.api.getFuturePayments(todayIso).then((payments) => {
        let solde = soldeInitial;
        // Paiements groupés par date
        const byDate = {};
        for (const p of payments || []) {
          if (!byDate[p.sampling_date]) byDate[p.sampling_date] = 0;
          byDate[p.sampling_date] += p.amount;
        }
        // Générer la liste des 60 prochains jours
        const allDates = [];
        let d = new Date(todayIso);
        for (let i = 0; i < 60; i++) {
          allDates.push(d.toISOString().slice(0, 10));
          d.setDate(d.getDate() + 1);
        }
        let alertDate = null;
        for (const date of allDates) {
          if (byDate[date]) solde += byDate[date];
          if ((limitAmount > 0 && solde <= limitAmount) || (limitAmount < 0 && solde <= limitAmount)) {
            alertDate = date;
            break;
          }
        }
        if (alertDate) {
          if (alertDate === todayIso) {
            setLimitAlert(`Attention, aujourd'hui vous avez atteint ou dépassé la limite de ${limitAmount} €.`);
          } else {
            setLimitAlert(`Attention, le ${new Date(alertDate).toLocaleDateString('fr-FR')} vous atteindrez ou dépasserez la limite de ${limitAmount} €.`);
          }
        } else {
          setLimitAlert('');
        }
      });
    });
  }, [limitAmount, paymentsPreview]);

  useEffect(() => {
    if (formData.source && formData.source.length > 0) {
      const input = formData.source.toLowerCase();
      const filtered = allSources.filter(s => s.toLowerCase().includes(input) && s.toLowerCase() !== input);
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.source, allSources]);

  const handleSuggestionClick = (s) => {
    setFormData({ ...formData, source: s });
    setShowSuggestions(false);
  };

  const categories = [
    'Loyer',
    'Alimentation',
    'Loisirs',
    'Transports',
    'Santé',
    'Abonnements',
    'Impôts',
    'Divers',
    "Salaires",
    "Crédit",
  ];

  const categoryColors = {
    'Loyer': 'text-purple-700',
    'Alimentation': 'text-green-700',
    'Loisirs': 'text-pink-600',
    'Transports': 'text-yellow-700',
    'Santé': 'text-red-600',
    'Abonnements': 'text-blue-700',
    'Impôts': 'text-orange-700',
    'Divers': 'text-gray-700',
    'Salaires': 'text-emerald-700',
    'Crédit': 'text-cyan-700',
  };

  const handleDownloadDB = async () => {
    const result = await window.api.dbDownload();
    if (result && result.success) {
      setInfoModal({ show: true, message: 'Base de données téléchargée avec succès !', type: 'success' });
    } else {
      setInfoModal({ show: true, message: 'Erreur lors du téléchargement de la base de données.', type: 'error' });
    }
  };

  const handleUpdateDB = async () => {
    const result = await window.api.dbUpdate();
    if (result && result.success) {
      setInfoModal({ show: true, message: 'Base de données mise à jour avec succès !', type: 'success' });
      await refreshAll(); // Rafraîchir le tableau après la mise à jour de la base
    } else {
      setInfoModal({ show: true, message: 'Erreur lors de la mise à jour de la base de données.', type: 'error' });
    }
  };

  const handleExportPayments = () => {
    setShowExportModal(true);
    setShowSettings(false);
  };

  const handleExportSubmit = async (e) => {
    e.preventDefault();
    // Appel à l'API Electron pour exporter en PDF ou CSV
    const result = await window.api.exportPayments({
      start: exportDates.start,
      end: exportDates.end,
      format: exportFormat
    });
    if (result && result.success) {
      setInfoModal({ show: true, message: `Export ${exportFormat.toUpperCase()} téléchargé avec succès !`, type: 'success' });
    } else {
      setInfoModal({ show: true, message: `Erreur lors de l'export ${exportFormat.toUpperCase()}.`, type: 'error' });
    }
    setShowExportModal(false);
  };

  const handleCloseInfoModal = () => setInfoModal({ show: false, message: '', type: 'success' });

  useEffect(() => {}, []);

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        id: editingPayment.id,
        source: editingPayment.source,
        amount: editingPayment.amount,
        sampling_date: editingPayment.sampling_date,
        months: editingPayment.nbr_month,
        pause: editingPayment.pause,
        category: editingPayment.category || '',
      });
    }
  }, [editingPayment]);

  useEffect(() => {
    if (!editingPayment) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        sampling_date: new Date().toISOString().split('T')[0],
        months: '1',
      }));
    }
  }, [editingPayment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleBatchChange = (e) => {
    const { name, value } = e.target;
    setBatchData({
      ...batchData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sampling_date || isNaN(new Date(formData.sampling_date).getTime())) {
      setInfoModal({ show: true, message: 'Date invalide ou manquante.', type: 'error' });
      return;
    }
    // Afficher la modale d'édition en masse uniquement si on MODIFIE un paiement récurrent
    if (
      editingPayment && editingPayment.unique_id && Number(formData.months) > 1
    ) {
      setEditMassModal({ show: true, formData: { ...formData } });
      return;
    }
    await onSubmit(formData);
    setFormData({ id: '', source: '', amount: '', sampling_date: new Date().toISOString().split('T')[0], months: '1', pause: false, category: '' });
    document.activeElement.blur();
    setInfoModal({ show: true, message: 'Paiement ajouté ou modifié avec succès.', type: 'success' });
    if (editingPayment) onCancel();
  };

  // Gestion de la modale édition en masse
  const handleEditMassChoice = async (all) => {
    if (all) {
      // Modification de tous les paiements liés (sauf la date)
      await window.api.updateByUniqueId({
        unique_id: editingPayment.unique_id,
        source: editMassModal.formData.source,
        amount: parseFloat(editMassModal.formData.amount),
        nbr_month: parseInt(editMassModal.formData.months, 10),
        pause: editMassModal.formData.pause,
        category: editMassModal.formData.category || '',
      });
      await refreshAll && refreshAll();
    } else {
      await onSubmit(editMassModal.formData);
    }
    setEditMassModal({ show: false, formData: null });
    setFormData({ id: '', source: '', amount: '', sampling_date: new Date().toISOString().split('T')[0], months: '1', pause: false, category: '' });
    setInfoModal({ show: true, message: 'Paiement modifié avec succès.', type: 'success' });
  };

  // Handler édition du montant limite
  const handleLimitAmountChange = (e) => {
    setLimitAmountInput(e.target.value.replace(/[^\d.,-]/g, ''));
  };
  const handleLimitAmountBlur = async () => {
    const val = parseFloat(limitAmountInput.replace(',', '.')) || 0;
    setLimitAmount(val);
    await window.api.setLimitAmount(val);
  };

  return (
    <div className="w-full md:w-1/4 bg-white shadow-md rounded-lg p-6 relative">
      {/* Bouton rouage */}
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
        onClick={() => setShowSettings((v) => !v)}
        title="Paramètres"
      >
        <FiSettings />
      </button>
      {/* Formulaire amélioré EN PREMIER */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Formulaires d'ajout de paiement</h2>
      <form onSubmit={handleSubmit} className="space-y-3 mb-8">
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <div className="relative">
              <input
                type="text"
                id="source"
                name="source"
                placeholder="Source"
                value={formData.source}
                onChange={handleChange}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoComplete="off"
                required
              />
              {showSuggestions && (
                <ul className="absolute left-0 right-0 bg-white border border-gray-300 rounded-lg shadow z-20 max-h-40 overflow-y-auto mt-1">
                  {suggestions.map((s, idx) => (
                    <li
                      key={s + idx}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      onMouseDown={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="w-32">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              id="amount"
              name="amount"
              placeholder="Montant"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              step="0.01"
              required
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="sampling_date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="sampling_date"
              name="sampling_date"
              value={formData.sampling_date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div className="w-32">
            <label htmlFor="months" className="block text-sm font-medium text-gray-700 mb-1">Mois répé.</label>
            <input
              type="number"
              id="months"
              name="months"
              placeholder="Mois"
              value={formData.months}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select
            id="category"
            name="category"
            value={formData.category || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          >
            <option value="" disabled>Catégorie</option>
            {categories.map(cat => (
              <option key={cat} value={cat} className={categoryColors[cat] || ''}>
                {categoryIcons[cat] ? `${categoryIcons[cat]} ` : ''}{cat}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 text-base"
        >
          Enregistrer
        </button>
        {editingPayment && (
          <button
            type="button"
            onClick={() => {
              setFormData({
                id: '',
                source: '',
                amount: '',
                sampling_date: new Date().toISOString().split('T')[0],
                months: '1',
                pause: false,
                category: ''
              });
              onCancel();
              setInfoModal({ show: true, message: 'Modification annulée.', type: 'info' });
            }}
            className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300 text-base"
          >
            Annuler
          </button>
        )}
      </form>
      {/* Menu paramètres */}
      {showSettings && (
        <div className="absolute top-14 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 flex flex-col space-y-2 min-w-[220px] pr-6 pt-6 ">
          {/* Croix de fermeture */}
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
            onClick={() => setShowSettings(false)}
            title="Fermer"
            tabIndex={0}
          >
            ×
          </button>
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition mb-2"
            onClick={handleDownloadDB}
          >
            Télécharger la base de données
          </button>
          <button
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition mb-2"
            onClick={handleUpdateDB}
          >
            Mettre à jour la base de données
          </button>
          <button
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition"
            onClick={handleExportPayments}
          >
            Exporter les paiements (PDF)
          </button>
        </div>
      )}
      {/* Solde mis en évidence */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2 mb-2">
          <span className="text-xl">💰</span> Solde
        </h2>
        <div className={`text-2xl font-semibold px-4 py-2 rounded-lg border ${balance >= 0 ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'} flex items-center justify-center`} style={{letterSpacing: '0.5px', fontFamily: 'inherit'}}>
          {Number(balance).toFixed(2)} €
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-gray-600 text-sm">Date limite&nbsp;:</span>
          <input
            type="date"
            value={limitDate}
            onChange={(e) => onSetLimit(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minWidth: '140px' }}
          />
          <span className="flex items-center gap-2 ml-auto">
            <span className="text-gray-600 text-sm">Montant limite&nbsp;:</span>
            <input
              type="number"
              step="0.01"
              value={limitAmountInput}
              onChange={handleLimitAmountChange}
              onBlur={handleLimitAmountBlur}
              className="w-24 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              style={{ fontSize: '1rem' }}
            />
            <span className="text-gray-600">€</span>
          </span>
        </div>
        <hr className="my-2 border-gray-300" />
        {limitAlert && (
          <div className="mt-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded shadow text-sm flex items-center gap-2">
            <span role="img" aria-label="alerte">⚠️</span> {limitAlert}
          </div>
        )}
      </div>

      {/* Modale édition en masse */}
      {editMassModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[420px] max-w-full relative animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6 text-indigo-700 flex items-center gap-2">
              <span>📝</span> Modification d’un paiement récurrent
            </h2>
            <p className="mb-8 text-gray-700 text-lg text-center">
              Ce paiement fait partie d’une série <span className="font-bold text-indigo-600">({formData.months} mois)</span>.<br />
              Voulez-vous modifier&nbsp;:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleEditMassChoice(false)}
                className="flex items-center gap-2 px-5 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow"
              >
                <span className="text-xl">✏️</span> Modifier <span className="font-bold ml-1">seulement ce paiement</span>
              </button>
              <button
                onClick={() => handleEditMassChoice(true)}
                className="flex items-center gap-2 px-5 py-3 w-full bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-base font-semibold shadow"
              >
                <span className="text-xl">🔄</span> Modifier <span className="font-bold ml-1">tous les paiements liés</span>
              </button>
              <button
                onClick={() => setEditMassModal({ show: false, formData: null })}
                className="flex items-center gap-2 px-5 py-3 w-full bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-base font-semibold shadow mt-2"
              >
                <span className="text-xl">❌</span> Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale export PDF */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowExportModal(false)}
              title="Fermer"
              tabIndex={0}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800">Exporter les paiements</h2>
            <form onSubmit={handleExportSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  value={exportDates.start}
                  onChange={e => setExportDates({ ...exportDates, start: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={exportDates.end}
                  onChange={e => setExportDates({ ...exportDates, end: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Format</label>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
              >
                Exporter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modale d'information */}
      {infoModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className={`bg-white p-6 rounded-lg shadow-lg w-96 border ${infoModal.type === 'error' ? 'border-red-400' : infoModal.type === 'info' ? 'border-blue-400' : 'border-green-400'}`}>
            <div className={`mb-4 text-lg font-bold ${infoModal.type === 'error' ? 'text-red-600' : infoModal.type === 'info' ? 'text-blue-600' : 'text-green-600'}`}>{infoModal.message}</div>
            <button
              onClick={handleCloseInfoModal}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;