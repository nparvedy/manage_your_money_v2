import React, { useState } from 'react';

const PaymentsTable = ({ payments, onEdit, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  // Modale choix suppression/édition en masse ou non
  const [massActionModal, setMassActionModal] = useState({ show: false, payment: null, action: null });

  // Filtres avancés
  const [search, setSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Palette de couleurs pour chaque catégorie (mêmes couleurs que Charts et Sidebar)
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

  // Fonction de filtrage
  const filteredPayments = payments.filter((p) => {
    const matchSource = search === '' || p.source.toLowerCase().includes(search.toLowerCase());
    const matchMin = minAmount === '' || p.amount >= parseFloat(minAmount);
    const matchMax = maxAmount === '' || p.amount <= parseFloat(maxAmount);
    const matchDateStart = dateStart === '' || p.sampling_date >= dateStart;
    const matchDateEnd = dateEnd === '' || p.sampling_date <= dateEnd;
    return matchSource && matchMin && matchMax && matchDateStart && matchDateEnd;
  });

  // Edition : ouvre directement le formulaire sans modale
  const handleEditClick = (id) => {
    onEdit(id);
  };

  // Suppression : propose la modale si paiement récurrent
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

  // Action édition en masse
  const handleEditMass = () => {
    onEdit(massActionModal.payment.id, true); // true = édition en masse
    setMassActionModal({ show: false, payment: null, action: null });
  };
  // Action édition simple
  const handleEditSingle = () => {
    onEdit(massActionModal.payment.id, false);
    setMassActionModal({ show: false, payment: null, action: null });
  };
  // Action suppression en masse
  const handleDeleteMass = async () => {
    await window.api.deleteByUniqueId(massActionModal.payment.unique_id);
    setMassActionModal({ show: false, payment: null, action: null });
    setPaymentToDelete(null);
    setShowDeleteModal(false);
    // Rafraîchir la liste (onDelete déclenche le refreshAll côté App)
    onDelete();
  };
  // Action suppression simple
  const handleDeleteSingle = () => {
    setPaymentToDelete(massActionModal.payment.id);
    setShowDeleteModal(true);
    setMassActionModal({ show: false, payment: null, action: null });
  };

  const renderPayments = () => {
    let lastMonth = '';
    const rows = [];

    filteredPayments.forEach((payment) => {
      const month = new Date(payment.sampling_date).toLocaleString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });

      if (month !== lastMonth) {
        rows.push(
          <tr key={`header-${month}`} className="bg-blue-100 font-bold text-gray-800 uppercase">
            <td colSpan="6" className="px-4 py-2">{month}</td>
          </tr>
        );

        const monthlyPayments = filteredPayments.filter((p) => {
          const pMonth = new Date(p.sampling_date).toLocaleString('fr-FR', {
            month: 'long',
            year: 'numeric',
          });
          return pMonth === month;
        });

        const positiveSum = monthlyPayments
          .filter((p) => p.amount >= 0)
          .reduce((sum, p) => sum + p.amount, 0);

        const negativeSum = monthlyPayments
          .filter((p) => p.amount < 0)
          .reduce((sum, p) => sum + p.amount, 0);

        rows.push(
          <tr key={`totals-${month}`} className="bg-blue-50 font-semibold text-gray-700 uppercase">
            <td colSpan="2" className="px-4 py-2">Totaux</td>
            <td className="px-4 py-2 text-green-600">+{positiveSum.toFixed(2)}</td>
            <td></td>
            <td className="px-4 py-2 text-red-600">{negativeSum.toFixed(2)}</td>
            <td></td>
          </tr>
        );

        lastMonth = month;
      }

      rows.push(
        <tr key={payment.id} className={payment.amount >= 0 ? 'bg-green-50' : 'bg-red-50'}>
          <td className="p-2">
            <button
              className="text-blue-500 hover:underline cursor-pointer"
              onClick={() => {
                handleEditClick(payment.id);
              }}
            >
              ✏️
            </button>
            <button
              className="text-red-500 hover:underline ml-2 cursor-pointer"
              onClick={() => handleDeleteClick(payment.id)}
            >
              🗑️
            </button>
          </td>
          <td className="p-2">{payment.source}</td>
          <td className="p-2">{payment.amount.toFixed(2)}</td>
          <td className="p-2">{payment.sampling_date}</td>
          <td className="p-2">{payment.nbr_month}</td>
          <td className={`p-2 ${categoryColors[payment.category] || ''}`}>{payment.category || ''}</td>
        </tr>
      );
    });

    return rows;
  };

  return (
    <div className="relative overflow-x-auto shadow-lg rounded-lg z-10">
      {/* Filtres avancés */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-100 rounded-t-lg border-b border-gray-300">
        <input
          type="text"
          placeholder="Rechercher par source..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="number"
          placeholder="Montant min"
          value={minAmount}
          onChange={e => setMinAmount(e.target.value)}
          className="p-2 border border-gray-300 rounded w-32"
        />
        <input
          type="number"
          placeholder="Montant max"
          value={maxAmount}
          onChange={e => setMaxAmount(e.target.value)}
          className="p-2 border border-gray-300 rounded w-32"
        />
        <input
          type="date"
          placeholder="Date début"
          value={dateStart}
          onChange={e => setDateStart(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="date"
          placeholder="Date fin"
          value={dateEnd}
          onChange={e => setDateEnd(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <button
          onClick={() => { setSearch(''); setMinAmount(''); setMaxAmount(''); setDateStart(''); setDateEnd(''); }}
          className="p-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-700"
        >
          Réinitialiser
        </button>
      </div>
      <table className="w-full text-base text-left text-gray-700">
        <thead className="text-sm text-white uppercase bg-indigo-500">
          <tr>
            <th scope="col" className="px-6 py-4">Actions</th>
            <th scope="col" className="px-6 py-4">Source</th>
            <th scope="col" className="px-6 py-4">Montant</th>
            <th scope="col" className="px-6 py-4">Date</th>
            <th scope="col" className="px-6 py-4">Mois</th>
            <th scope="col" className="px-6 py-4">Catégorie</th>
          </tr>
        </thead>
        <tbody className="bg-gray-50 divide-y divide-gray-300">
          {renderPayments()}
        </tbody>
      </table>
      {/* Modale choix édition/suppression masse ou non */}
      {massActionModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              {massActionModal.action === 'edit' ? 'Modification d’un paiement récurrent' : 'Suppression d’un paiement récurrent'}
            </h2>
            <p className="mb-6 text-gray-700">
              Ce paiement fait partie d’une série ({massActionModal.payment.nbr_month} mois). Voulez-vous {massActionModal.action === 'edit' ? 'modifier' : 'supprimer'} seulement ce paiement ou tous les paiements liés&nbsp;?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setMassActionModal({ show: false, payment: null, action: null })}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Annuler
              </button>
              {massActionModal.action === 'edit' ? (
                <>
                  <button
                    onClick={handleEditSingle}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Modifier seulement celui-ci
                  </button>
                  <button
                    onClick={handleEditMass}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Modifier tous
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDeleteSingle}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Supprimer seulement celui-ci
                  </button>
                  <button
                    onClick={handleDeleteMass}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer tous
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