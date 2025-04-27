import React, { useState } from 'react';

const PaymentsTable = ({ payments, onEdit, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const handleDeleteClick = (id) => {
    setPaymentToDelete(id);
    setShowDeleteModal(true);
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

  const renderPayments = () => {
    let lastMonth = '';
    const rows = [];

    payments.forEach((payment) => {
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

        const monthlyPayments = payments.filter((p) => {
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
                onEdit(payment.id);
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
        </tr>
      );
    });

    return rows;
  };

  return (
    <div className="relative overflow-x-auto shadow-lg rounded-lg z-10">
      <table className="w-full text-base text-left text-gray-700">
        <thead className="text-sm text-white uppercase bg-indigo-500">
          <tr>
            <th scope="col" className="px-6 py-4">Actions</th>
            <th scope="col" className="px-6 py-4">Source</th>
            <th scope="col" className="px-6 py-4">Montant</th>
            <th scope="col" className="px-6 py-4">Date</th>
            <th scope="col" className="px-6 py-4">Mois</th>
          </tr>
        </thead>
        <tbody className="bg-gray-50 divide-y divide-gray-300">
          {renderPayments()}
        </tbody>
      </table>
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