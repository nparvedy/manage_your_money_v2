import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';

const PaymentsTable = ({ payments, onEdit, onDelete }) => {
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
        <input type="text" placeholder="Rechercher par source..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 border border-gray-300 rounded" />
        <input type="number" placeholder="Montant min" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="p-2 border border-gray-300 rounded w-32" />
        <input type="number" placeholder="Montant max" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="p-2 border border-gray-300 rounded w-32" />
        <input type="date" placeholder="Date début" value={dateStart} onChange={e => setDateStart(e.target.value)} className="p-2 border border-gray-300 rounded" />
        <input type="date" placeholder="Date fin" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="p-2 border border-gray-300 rounded" />
        <button onClick={() => { setSearch(''); setMinAmount(''); setMaxAmount(''); setDateStart(''); setDateEnd(''); }} className="p-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-700">Réinitialiser</button>
      </div>
      {months.map((month, idx) => {
        const monthlyPayments = paymentsByMonth[month];
        const positiveSum = monthlyPayments.filter(p => p.amount >= 0).reduce((sum, p) => sum + p.amount, 0);
        const negativeSum = monthlyPayments.filter(p => p.amount < 0).reduce((sum, p) => sum + p.amount, 0);
        return (
          <React.Fragment key={month}>
            {idx > 0 && <div style={{height: 32}}></div>}
            <table className="w-full text-base text-left text-gray-700 mb-0 shadow-md rounded-lg">
              <thead className="text-sm text-white uppercase bg-indigo-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Actions</th>
                  <th scope="col" className="px-6 py-4">Source</th>
                  <th scope="col" className="px-6 py-4">Montant</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4">Mois</th>
                  <th scope="col" className="px-6 py-4">Catégorie</th>
                  <th scope="col" className="px-6 py-4">Reçu</th>
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
                    <td className="p-2">
                      <button className="text-blue-500 hover:underline cursor-pointer" onClick={() => handleEditClick(payment.id)}>✏️</button>
                      <button className="text-red-500 hover:underline ml-2 cursor-pointer" onClick={() => handleDeleteClick(payment.id)}>🗑️</button>
                    </td>
                    <td className="p-2">{payment.source}</td>
                    <td className="p-2">{payment.amount.toFixed(2)}</td>
                    <td className="p-2">{payment.sampling_date}</td>
                    <td className="p-2">{payment.nbr_month}</td>
                    <td className={`p-2 ${categoryColors[payment.category] || ''}`}>{payment.category || ''}</td>
                    <td className="p-2 text-center">
                      {payment.attachment ? (
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Voir la pièce jointe"
                          onClick={() => {
                            setAttachmentUrl(payment.attachment);
                            setAttachmentType(payment.attachment.endsWith('.pdf') ? 'pdf' : 'image');
                            setAttachmentName(payment.attachment.split(/[\\/]/).pop());
                            setShowAttachmentModal(true);
                          }}
                        >
                          <FaRegEye className="inline text-xl" />
                        </button>
                      ) : (
                        <span className="inline-block text-gray-400 relative group">
                          <FaRegEyeSlash className="inline text-xl" />
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
              <span>{massActionModal.action === 'edit' ? '📝' : '🗑️'}</span> {massActionModal.action === 'edit' ? 'Modification d’un paiement récurrent' : 'Suppression d’un paiement récurrent'}
            </h2>
            <p className="mb-8 text-gray-700 text-lg text-center">
              Ce paiement fait partie d’une série <span className="font-bold text-indigo-600">({massActionModal.payment.nbr_month} mois)</span>.<br />
              Voulez-vous {massActionModal.action === 'edit' ? 'modifier' : 'supprimer'}&nbsp;:
            </p>
            <div className="flex flex-col gap-3">
              {massActionModal.action === 'edit' ? (
                <>
                  <button
                    onClick={handleEditSingle}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">✏️</span> Modifier <span className="font-bold ml-1">seulement ce paiement</span>
                  </button>
                  <button
                    onClick={handleEditMass}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">🔄</span> Modifier <span className="font-bold ml-1">tous les paiements liés</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDeleteSingle}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">🗑️</span> Supprimer <span className="font-bold ml-1">seulement ce paiement</span>
                  </button>
                  <button
                    onClick={handleDeleteMass}
                    className="flex items-center gap-2 px-5 py-3 w-full bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base font-semibold shadow"
                  >
                    <span className="text-xl">🗑️</span> Supprimer <span className="font-bold ml-1">tous les paiements liés</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setMassActionModal({ show: false, payment: null, action: null })}
                className="flex items-center gap-2 px-5 py-3 w-full bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-base font-semibold shadow mt-2"
              >
                <span className="text-xl">❌</span> Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Confirmer la suppression</h2>
            <p className="mb-6 text-gray-700">Voulez-vous vraiment supprimer ce paiement ? Cette action est irréversible.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTable;