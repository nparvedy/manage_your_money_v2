import React, { useState, useEffect } from 'react';
import { FiSettings } from 'react-icons/fi';

const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

const Sidebar = ({ onSubmit, onCancel, onSetLimit, balance, limitDate, editingPayment, refreshAll }) => {
  const [formData, setFormData] = useState({
    id: '',
    source: '',
    amount: '',
    sampling_date: '',
    months: '',
    pause: false,
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
    await onSubmit(formData);
    setFormData({ id: '', source: '', amount: '', sampling_date: new Date().toISOString().split('T')[0], months: '1', pause: false });
    document.activeElement.blur();
    setInfoModal({ show: true, message: 'Paiement ajouté ou modifié avec succès.', type: 'success' });
  };

  const handleBatchUpdate = async (e) => {
    e.preventDefault();
    await window.api.updateBySource({
      source: batchData.batchSource,
      newAmount: batchData.batchAmount,
      startDate: batchData.batchStart,
      endDate: batchData.batchEnd,
    });
    await refreshAll(); // Utilisation de refreshAll passé comme prop
    setBatchData({ batchSource: '', batchAmount: '', batchStart: '', batchEnd: '' });
    setShowBatchModal(false);
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Formulaires d'ajout de paiement</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="source"
          placeholder="Source"
          value={formData.source}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Montant"
          value={formData.amount}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          step="0.01"
          required
        />
        <input
          type="date"
          name="sampling_date"
          value={formData.sampling_date}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="number"
          name="months"
          placeholder="Mois répé."
          value={formData.months}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <label className="flex items-center space-x-2">
          {/* <input
            type="checkbox"
            name="pause"
            checked={formData.pause}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-gray-700">Pause</span> */}
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Enregistrer
        </button>
        {editingPayment && (
          <button
            type="button"
            onClick={() => {
              setFormData({ id: '', source: '', amount: '', sampling_date: new Date().toISOString().split('T')[0], months: '1', pause: false });
              onCancel();
              setTimeout(() => setFormData({}), 0);
              setInfoModal({ show: true, message: 'Modification annulée.', type: 'info' });
            }}
            className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition duration-300"
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowBatchModal(true)}
          className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition duration-300"
        >
          Modifier par source
        </button>
      </form>

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center" style={{ zIndex: 1000 }} onClick={() => setShowBatchModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Mise à jour en masse</h2>
            <form onSubmit={handleBatchUpdate} className="space-y-4">
              <input
                type="text"
                name="batchSource"
                placeholder="Source"
                value={batchData.batchSource}
                onChange={handleBatchChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                name="batchAmount"
                placeholder="Nouveau Montant"
                value={batchData.batchAmount}
                onChange={handleBatchChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                required
              />
              <input
                type="date"
                name="batchStart"
                value={batchData.batchStart}
                onChange={handleBatchChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="date"
                name="batchEnd"
                value={batchData.batchEnd}
                onChange={handleBatchChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Appliquer
              </button>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition duration-300"
              >
                Fermer
              </button>
            </form>
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

      <div className="mt-6">
        <h2 className="text-lg font-bold text-gray-800">Solde</h2>
        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{balance} €</div>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-bold text-gray-800">Date limite</h2>
        <input
          type="date"
          value={limitDate}
          onChange={(e) => onSetLimit(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default Sidebar;