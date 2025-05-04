import React, { useState, useEffect } from 'react';
import { FaPaperclip } from 'react-icons/fa';
import AddPaymentForm from './sidebar/AddPaymentForm';
import SidebarBalance from './sidebar/SidebarBalance';
import SidebarBudgetPeriod from './sidebar/SidebarBudgetPeriod';

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
    attachment: null, // Ajout pour la pièce jointe
  });

  // Ajout d'un état pour le signe du montant (+1 ou -1)
  const [amountSign, setAmountSign] = useState(1);

  // Ajout d'un state pour le nom du fichier sélectionné
  const [attachmentName, setAttachmentName] = useState('');

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchData, setBatchData] = useState({
    batchSource: '',
    batchAmount: '',
    batchStart: '',
    batchEnd: '',
  });

  const [infoModal, setInfoModal] = useState({ show: false, message: '', type: 'success' });

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
  // Montant restant avant d’atteindre la limite à la date choisie
  const [remainingBeforeLimit, setRemainingBeforeLimit] = useState(null);

  // Date de retour du budget (première date où le solde repasse au-dessus de la limite)
  const [budgetReturnDate, setBudgetReturnDate] = useState(null);

  // Date de dépassement de la limite
  const [budgetExceededDate, setBudgetExceededDate] = useState(null);

  // Pour la répartition du montant restant
  const [splitMode, setSplitMode] = useState('day'); // 'day' ou 'week'
  const [splitStartDay, setSplitStartDay] = useState('lundi'); // jour de début de semaine

  // Liste des jours de la semaine
  const weekDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

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
    const localIso = today.toISOString().slice(0, 10);
    window.api.getFuturePayments(localIso).then((p) => setPaymentsPreview(p || []));
    // Afficher le solde actuel d'aujourd'hui dans la console
  }, [limitDate, balance]);

  // Calcul du jour où le solde passe sous le montant limite ET du retour au-dessus
  useEffect(() => {
    if (limitAmount === undefined || limitAmount === null || !paymentsPreview.length) {
      setLimitAlert('');
      setBudgetReturnDate(null);
      setBudgetExceededDate(null);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const localIso = today.toLocaleDateString('fr-CA');
    window.api.getBalanceAt(localIso).then((soldeInitial) => {
      window.api.getFuturePayments(localIso).then((payments) => {
        let solde = soldeInitial;
        const byDate = {};
        for (const p of payments || []) {
          if (!byDate[p.sampling_date]) byDate[p.sampling_date] = 0;
          byDate[p.sampling_date] += p.amount;
        }
        const allDates = [];
        let d = new Date(localIso);
        for (let i = 0; i < 60; i++) { // 120 jours pour couvrir le retour
          allDates.push(d.toISOString().slice(0, 10));
          d.setDate(d.getDate() + 1);
        }
        let alertDate = null;
        let wasUnder = (limitAmount > 0 && solde <= limitAmount) || (limitAmount < 0 && solde <= limitAmount);
        let returnDate = null;
        for (const date of allDates) {
          if (date !== localIso) {
            if (byDate[date]) solde += byDate[date];
            if (!alertDate && ((limitAmount > 0 && solde <= limitAmount) || (limitAmount < 0 && solde <= limitAmount))) {
              alertDate = date;
              wasUnder = true;
            }
            if (wasUnder && ((limitAmount > 0 && solde > limitAmount) || (limitAmount < 0 && solde > limitAmount))) {
              returnDate = date;
              break;
            }
          }
        }
        if (alertDate) {
          if (alertDate === localIso) {
            setLimitAlert(`Attention, aujourd'hui vous avez atteint ou dépassé la limite de ${limitAmount} €.`);
          } else {
            setLimitAlert(`Attention, le ${new Date(alertDate).toLocaleDateString('fr-FR')} vous atteindrez ou dépasserez la limite de ${limitAmount} €.`);
          }
        } else {
          setLimitAlert('');
        }
        setBudgetExceededDate(alertDate ? new Date(alertDate) : null);
        setBudgetReturnDate(returnDate ? new Date(returnDate) : null);
      });
    });
  }, [limitAmount, paymentsPreview]);

  // Calcul du montant restant avant d’atteindre la limite à la date choisie
  useEffect(() => {
    if (!limitDate || limitAmount === undefined || limitAmount === null) {
      setRemainingBeforeLimit(null);
      return;
    }
    window.api.getBalanceAt(limitDate).then((solde) => {
      setRemainingBeforeLimit(Number(solde) - Number(limitAmount));
    });
  }, [limitDate, limitAmount, paymentsPreview]);

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

  const handleCloseInfoModal = () => setInfoModal({ show: false, message: '', type: 'success' });

  useEffect(() => {}, []);

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        id: editingPayment.id,
        source: editingPayment.source,
        amount: Math.abs(editingPayment.amount),
        sampling_date: editingPayment.sampling_date,
        months: editingPayment.nbr_month,
        pause: editingPayment.pause,
        category: editingPayment.category || '',
        attachment: null, // on ne met pas le fichier ici, mais on garde le chemin pour l'affichage
      });
      setAmountSign(editingPayment.amount >= 0 ? 1 : -1);
      setAttachmentName(editingPayment.attachment ? editingPayment.attachment.split(/[\\/]/).pop() : '');
    }
  }, [editingPayment]);

  useEffect(() => {
    if (!editingPayment) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        sampling_date: new Date().toISOString().split('T')[0],
        months: '1',
        amount: '',
      }));
      setAmountSign(1);
    }
  }, [editingPayment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'amount') {
      // Toujours stocker la valeur absolue dans le champ
      setFormData({
        ...formData,
        [name]: value.replace('-', ''),
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleBatchChange = (e) => {
    const { name, value } = e.target;
    setBatchData({
      ...batchData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, attachment: file || null });
    setAttachmentName(file ? file.name : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sampling_date || isNaN(new Date(formData.sampling_date).getTime())) {
      setInfoModal({ show: true, message: 'Date invalide ou manquante.', type: 'error' });
      return;
    }
    let attachmentPath = '';
    if (formData.attachment) {
      // Nouvelle pièce jointe sélectionnée
      const result = await window.api.uploadAttachment(formData.attachment);
      if (result && result.path) {
        attachmentPath = result.path;
      }
    } else if (editingPayment && editingPayment.attachment) {
      // Pas de nouvelle pièce jointe, on garde l'ancienne
      attachmentPath = editingPayment.attachment;
    }
    // Appliquer le signe choisi au montant
    const dataToSend = { ...formData, amount: formData.amount ? amountSign * Math.abs(parseFloat(formData.amount)) : '', attachment: attachmentPath };
    console.log('DEBUG PIECE JOINTE:', dataToSend);
    // Afficher la modale d'édition en masse uniquement si on MODIFIE un paiement récurrent
    if (
      editingPayment && editingPayment.unique_id && Number(formData.months) > 1
    ) {
      setEditMassModal({ show: true, formData: { ...dataToSend } });
      return;
    }
    await onSubmit(dataToSend);
    setFormData({ id: '', source: '', amount: '', sampling_date: new Date().toISOString().split('T')[0], months: '1', pause: false, category: '', attachment: null });
    setAttachmentName('');
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
    setFormData({ id: '', source: '', amount: '', sampling_date: new Date().toISOString().split('T')[0], months: '1', pause: false, category: '', attachment: null });
    setAttachmentName('');
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
    <div className="w-full md:w-1/4 bg-white shadow-lg rounded-lg p-6 relative">
      {/* Formulaire amélioré EN PREMIER */}
      <AddPaymentForm
        formData={formData}
        setFormData={setFormData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        handleSuggestionClick={handleSuggestionClick}
        categories={categories}
        categoryColors={categoryColors}
        categoryIcons={categoryIcons}
        handleFileChange={handleFileChange}
        attachmentName={attachmentName}
        setAttachmentName={setAttachmentName}
        editingPayment={editingPayment}
        onCancel={onCancel}
        setInfoModal={setInfoModal}
        amountSign={amountSign}
        setAmountSign={setAmountSign}
      />
      <SidebarBalance balance={balance} />
      <SidebarBudgetPeriod
        limitDate={limitDate}
        onSetLimit={onSetLimit}
        limitAmountInput={limitAmountInput}
        handleLimitAmountChange={handleLimitAmountChange}
        handleLimitAmountBlur={handleLimitAmountBlur}
        remainingBeforeLimit={remainingBeforeLimit}
        budgetExceededDate={budgetExceededDate}
        budgetReturnDate={budgetReturnDate}
        limitAlert={limitAlert}
        splitMode={splitMode}
        setSplitMode={setSplitMode}
        splitStartDay={splitStartDay}
        setSplitStartDay={setSplitStartDay}
        weekDays={weekDays}
      />

      {/* Modale édition en masse */}
      {editMassModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[420px] max-w-full relative animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6 text-indigo-700 flex items-center gap-2">
              <span>📝</span> {window.api.t('modal.mass_edit_title')}
            </h2>
            <p className="mb-8 text-gray-700 text-lg text-center">
              {window.api.t('modal.mass_action_text', { months: formData.months, action: window.api.t('modal.edit') })}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleEditMassChoice(false)}
                className="flex items-center gap-2 px-5 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow"
              >
                <span className="text-xl">✏️</span> {window.api.t('modal.edit_single')}
              </button>
              <button
                onClick={() => handleEditMassChoice(true)}
                className="flex items-center gap-2 px-5 py-3 w-full bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-base font-semibold shadow"
              >
                <span className="text-xl">🔄</span> {window.api.t('modal.edit_all')}
              </button>
              <button
                onClick={() => setEditMassModal({ show: false, formData: null })}
                className="flex items-center gap-2 px-5 py-3 w-full bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-base font-semibold shadow mt-2"
              >
                <span className="text-xl">❌</span> {window.api.t('modal.cancel')}
              </button>
            </div>
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