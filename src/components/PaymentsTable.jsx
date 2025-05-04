import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash, FaPen, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// Fonction utilitaire pour formater la date au format français
function formatDateFR(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('fr-FR');
}

const PaymentsTable = ({ payments, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [massActionModal, setMassActionModal] = useState({ show: false, payment: null, action: null });
  const [search, setSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

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
  // Couleurs de fond pour chaque catégorie
  const categoryBgColors = {
    'Loyer': 'bg-purple-500',
    'Alimentation': 'bg-green-500',
    'Loisirs': 'bg-pink-500',
    'Transports': 'bg-yellow-500',
    'Santé': 'bg-red-500',
    'Abonnements': 'bg-blue-500',
    'Impôts': 'bg-orange-500',
    'Divers': 'bg-gray-500',
    'Salaires': 'bg-emerald-500',
    'Crédit': 'bg-cyan-500',
  };

  // Filtrage
  const filteredPayments = payments.filter((p) => {
    const matchSource = search === '' || p.source.toLowerCase().includes(search.toLowerCase());
    const matchMin = minAmount === '' || p.amount >= parseFloat(minAmount);
    const matchMax = maxAmount === '' || p.amount <= parseFloat(maxAmount);
    const matchDateStart = dateStart === '' || p.sampling_date >= dateStart;
    const matchDateEnd = dateEnd === '' || p.sampling_date <= dateEnd;
    return matchSource && matchMin && matchMax && matchDateStart && matchDateEnd;
  });

  // Groupe les paiements par mois
  const paymentsByMonth = {};
  filteredPayments.forEach((p) => {
    const month = new Date(p.sampling_date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    if (!paymentsByMonth[month]) paymentsByMonth[month] = [];
    paymentsByMonth[month].push(p);
  });
  const months = Object.keys(paymentsByMonth);

  // Actions (inchangées)
  const handleEditClick = (id) => { onEdit(id); };
  const handleDeleteClick = (id) => {
    const payment = payments.find((p) => p.id === id);
    if (payment && payment.unique_id && payment.nbr_month > 1) {
      setMassActionModal({ show: true, payment, action: 'delete' });
    } else {
      setPaymentToDelete(id);
      setShowDeleteModal(true);
    }
  };
  const confirmDelete = () => {
    if (paymentToDelete) {
      onDelete(paymentToDelete);
      setShowDeleteModal(false);
      setPaymentToDelete(null);
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPaymentToDelete(null);
  };
  const handleEditMass = () => {
    onEdit(massActionModal.payment.id, true);
    setMassActionModal({ show: false, payment: null, action: null });
  };
  const handleEditSingle = () => {
    onEdit(massActionModal.payment.id, false);
    setMassActionModal({ show: false, payment: null, action: null });
  };
  const handleDeleteMass = async () => {
    await window.api.deleteByUniqueId(massActionModal.payment.unique_id);
    setMassActionModal({ show: false, payment: null, action: null });
    setPaymentToDelete(null);
    setShowDeleteModal(false);
    onDelete();
  };
  const handleDeleteSingle = () => {
    setPaymentToDelete(massActionModal.payment.id);
    setShowDeleteModal(true);
    setMassActionModal({ show: false, payment: null, action: null });
  };

  return (
    <div className="relative overflow-x-auto z-10">
      {/* Filtres avancés */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-100 rounded-t-lg border-b border-gray-300">
        <input type="text" placeholder={t('table.search_source')} value={search} onChange={e => setSearch(e.target.value)} className="p-2 border border-gray-300 rounded bg-white" />
        <input type="number" placeholder={t('table.min_amount')} value={minAmount} onChange={e => setMinAmount(e.target.value)} className="p-2 border border-gray-300 rounded w-32 bg-white" />
        <input type="number" placeholder={t('table.max_amount')} value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="p-2 border border-gray-300 rounded w-32 bg-white" />
        <input type="date" placeholder={t('table.date_start')} value={dateStart} onChange={e => setDateStart(e.target.value)} className="p-2 border border-gray-300 rounded bg-white" />
        <input type="date" placeholder={t('table.date_end')} value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="p-2 border border-gray-300 rounded bg-white" />
        <button onClick={() => { setSearch(''); setMinAmount(''); setMaxAmount(''); setDateStart(''); setDateEnd(''); }} className="p-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-700 cursor-pointer">{t('table.reset')}</button>
      </div>
      {months.map((month, idx) => {
        const monthlyPayments = paymentsByMonth[month];
        const positiveSum = monthlyPayments.filter(p => p.amount >= 0).reduce((sum, p) => sum + p.amount, 0);
        const negativeSum = monthlyPayments.filter(p => p.amount < 0).reduce((sum, p) => sum + p.amount, 0);
        return (
          <React.Fragment key={month}>
            {idx > 0 && <div style={{height: 32}}></div>}
            <table className="w-full text-base text-left text-gray-700 mb-0 shadow-md rounded-lg">
              <thead className="text-sm text-white uppercase" style={{background: 'oklch(37.9% .146 265.522)'}}>
                <tr>
                  <th scope="col" className="px-6 py-4">{t('table.actions')}</th>
                  <th scope="col" className="px-6 py-4">{t('table.source')}</th>
                  <th scope="col" className="px-6 py-4">{t('table.amount')}</th>
                  <th scope="col" className="px-6 py-4">{t('table.date')}</th>
                  <th scope="col" className="px-6 py-4">{t('table.months')}</th>
                  <th scope="col" className="px-6 py-4">{t('table.category')}</th>
                  <th scope="col" className="px-6 py-4">{t('table.receipt')}</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50 divide-y divide-gray-300">
                <tr className="bg-blue-100 font-bold text-gray-800 uppercase">
                  <td colSpan="7" className="px-4 py-2">
                    <div className="flex items-center w-full">
                      <span className="pl-2 text-left flex items-center gap-4">
                        {month}
                        <span className="border-l-2 border-blue-300 h-6 mx-3"></span>
                        <span className="text-green-600">+{positiveSum.toFixed(2)}</span>
                        <span className="text-red-600 ml-4">{negativeSum.toFixed(2)}</span>
                      </span>
                    </div>
                  </td>
                </tr>
                {monthlyPayments.map(payment => (
                  <tr key={payment.id} className={payment.amount >= 0 ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-3 py-2">
                      <button className="text-blue-500 hover:text-blue-900 cursor-pointer" onClick={() => handleEditClick(payment.id)} title="Modifier">
                        <FaPen className="inline text-lg align-middle" />
                      </button>
                      <button className="text-red-500 hover:text-red-400 ml-4 cursor-pointer" onClick={() => handleDeleteClick(payment.id)} title="Supprimer">
                        <FaTrash className="inline text-lg align-middle" />
                      </button>
                    </td>
                    <td className="px-3 py-2">{payment.source}</td>
                    <td className="px-3 py-2">{payment.amount.toFixed(2)}</td>
                    <td className="px-3 py-2">{formatDateFR(payment.sampling_date)}</td>
                    <td className="px-3 py-2">{payment.nbr_month}</td>
                    <td className={`px-3 py-2`}>
                      {payment.category ? (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-semibold text-white text-base shadow-sm ${categoryBgColors[payment.category] || 'bg-gray-500'} border-white`}
                          style={{ minWidth: 90, justifyContent: 'center' }}
                        >
                          <span className="inline-flex items-center justify-center rounded-full bg-white" style={{ width: 28, height: 28 }}>
                            <span className="text-lg" style={{ color: 'black' }}>{categoryIcons[payment.category] || ''}</span>
                          </span>
                          <span>{t(`categories.${payment.category}`)}</span>
                        </span>
                      ) : ''}
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      {payment.attachment ? (
                        <button
                          className="text-indigo-900 hover:text-indigo-600 cursor-pointer flex items-center justify-center mx-auto"
                          title="Voir la pièce jointe"
                          onClick={() => {
                            setAttachmentUrl(payment.attachment);
                            setAttachmentType(payment.attachment.endsWith('.pdf') ? 'pdf' : 'image');
                            setAttachmentName(payment.attachment.split(/[\\/]/).pop());
                            setShowAttachmentModal(true);
                          }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                        >
                          <FaRegEye className="inline text-xl align-middle" />
                        </button>
                      ) : (
                        <span className="inline-block text-gray-400 relative group">
                          <FaRegEyeSlash className="inline text-xl align-middle" />
                          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                            Aucune pièce jointe
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </React.Fragment>
        );
      })}
      {/* Modale pièce jointe */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90vw] max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowAttachmentModal(false)}
              title="Fermer"
              tabIndex={0}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaRegEye className="text-indigo-600" /> Pièce jointe : {attachmentName}
            </h2>
            <div className="flex items-center justify-center min-h-[300px]">
              {attachmentType === 'pdf' ? (
                <iframe
                  src={attachmentUrl}
                  title="PDF"
                  className="w-full h-[60vh] border rounded shadow"
                />
              ) : (
                <img
                  src={attachmentUrl}
                  alt="Pièce jointe"
                  className="max-w-full max-h-[60vh] rounded shadow"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modale choix édition/suppression masse ou non */}
      {massActionModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[420px] max-w-full relative animate-fade-in">
            <h2 className="text-2xl font-extrabold mb-6 text-indigo-700 flex items-center gap-2">
              <span>{massActionModal.action === 'edit' ? '📝' : '🗑️'}</span> {massActionModal.action === 'edit' ? t('modal.mass_edit_title') : t('modal.mass_delete_title')}
            </h2>
            <p className="mb-8 text-gray-700 text-lg text-center">
              {t('modal.mass_action_text', { months: massActionModal.payment.nbr_month, action: t('modal.' + (massActionModal.action === 'edit' ? 'edit' : 'delete')) })}
            </p>
            <div className="flex flex-col gap-3">
              {massActionModal.action === 'edit' ? (
                <>
                  <button
                    onClick={handleEditSingle}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">✏️</span> {t('modal.edit_single')}
                  </button>
                  <button
                    onClick={handleEditMass}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">🔄</span> {t('modal.edit_all')}
                  </button>
                  <button
                    onClick={() => setMassActionModal({ show: false, payment: null, action: null })}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-base font-semibold shadow mt-2"
                  >
                    <span className="text-xl">❌</span> {t('modal.cancel')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDeleteSingle}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">🗑️</span> {t('modal.delete_single')}
                  </button>
                  <button
                    onClick={handleDeleteMass}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">🗑️</span> {t('modal.delete_all')}
                  </button>
                  <button
                    onClick={() => setMassActionModal({ show: false, payment: null, action: null })}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-base font-semibold shadow mt-2"
                  >
                    <span className="text-xl">❌</span> {t('modal.cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-gray-800">{t('table.confirm_delete_title')}</h2>
            <p className="mb-6 text-gray-700">{t('table.confirm_delete_text')}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                {t('table.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t('table.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTable;