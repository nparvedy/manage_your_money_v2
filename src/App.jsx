import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import PaymentsTable from './components/PaymentsTable';
import Charts from './components/Charts';
import { FaChartBar, FaDatabase } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import './i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import LanguageSelector from './components/LanguageSelector';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:3001'; // À adapter si besoin

const getOrCreateUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('userId', userId);
  }
  return userId;
};

const sendPresence = async (type) => {
  const userId = getOrCreateUserId();
  try {
    const res = await fetch(`${API_URL}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, timestamp: Date.now() })
    });
    const data = await res.json();
    console.log(`[${type}]`, data);
  } catch (err) {
    console.log(`[${type}] Erreur de connexion à l'API`, err);
  }
};

const App = () => {
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [limitDate, setLimitDate] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [chartsVisible, setChartsVisible] = useState(false);
  const [chartsDateStart, setChartsDateStart] = useState('');
  const [chartsDateEnd, setChartsDateEnd] = useState('');
  const [showDbMenu, setShowDbMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState('pdf');
  const [infoModal, setInfoModal] = useState({ show: false, message: '', type: 'success' });

  const { t } = useTranslation();

  const fetchData = async () => {
    const fetchedLimitDate = await window.api.getLimitDate();
    setLimitDate(fetchedLimitDate);

    const fetchedPayments = await window.api.getPayments(fetchedLimitDate);
    const fetchedBalance = await window.api.getBalance();

    setPayments(fetchedPayments);
    setBalance(fetchedBalance);
  };

  const refreshAll = async () => {
    await fetchData();
  };

  useEffect(() => {
    if (!window.api) {
      console.error('window.api is not defined. Ensure preload.js is correctly configured.');
    }
    fetchData();
  }, []);

  useEffect(() => {}, [payments]);

  useEffect(() => {}, [editingPayment]);

  useEffect(() => {
    if (showCharts) {
      setChartsVisible(true);
    } else {
      const timeout = setTimeout(() => setChartsVisible(false), 500); // 500ms = durée animation
      return () => clearTimeout(timeout);
    }
  }, [showCharts]);

  // Initialiser la plage par défaut au mois courant de la date limite
  useEffect(() => {
    if (limitDate) {
      const d = new Date(limitDate);
      const year = d.getFullYear();
      const month = d.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
      setChartsDateStart(firstDay);
      setChartsDateEnd(limitDate);
    }
  }, [limitDate]);

  useEffect(() => {
    sendPresence('connect');
    const handleUnload = () => sendPresence('disconnect');
    window.addEventListener('beforeunload', handleUnload);

    // Ajout : ping toutes les 5 minutes
    const interval = setInterval(() => {
      sendPresence('keepalive');
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      sendPresence('disconnect');
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(interval);
    };
  }, []);

  const handleAddOrUpdatePayment = async (data) => {
    try {
      if (data.id) {
        await window.api.updatePayment(data);
      } else {
        await window.api.createPayment(data);
      }
      await fetchData(); // Rafraîchir les données après une mise à jour ou un ajout
    } catch (error) {
      console.error('Error adding or updating payment:', error);
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      await window.api.deletePayment(id);
      refreshAll();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleSetLimitDate = async (date) => {
    try {
      await window.api.setLimitDate(date);
      refreshAll();
    } catch (error) {
      console.error('Error setting limit date:', error);
    }
  };

  const handleEditPayment = (id) => {
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      setEditingPayment(payment);
    }
  };

  const handleDownloadDB = async () => {
    const result = await window.api.dbDownload();
    if (result && result.success) {
      setInfoModal({ show: true, message: 'Base de données téléchargée avec succès !', type: 'success' });
    } else {
      setInfoModal({ show: true, message: 'Erreur lors du téléchargement de la base de données.', type: 'error' });
    }
    setShowDbMenu(false);
  };

  const handleUpdateDB = async () => {
    const result = await window.api.dbUpdate();
    if (result && result.success) {
      setInfoModal({ show: true, message: 'Base de données mise à jour avec succès !', type: 'success' });
      await refreshAll();
    } else {
      setInfoModal({ show: true, message: 'Erreur lors de la mise à jour de la base de données.', type: 'error' });
    }
    setShowDbMenu(false);
  };

  const handleExportPayments = () => {
    setShowExportModal(true);
    setShowDbMenu(false);
  };

  const handleExportSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <I18nextProvider i18n={i18n}>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50">
        <Sidebar
          onSubmit={handleAddOrUpdatePayment}
          onCancel={() => setEditingPayment(null)}
          onSetLimit={handleSetLimitDate}
          balance={balance}
          limitDate={limitDate}
          editingPayment={editingPayment}
          refreshAll={refreshAll}
        />
        <div className="flex-1 p-10 overflow-y-auto">
          <header className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800">{t('header.title')}</h1>
              <p className="text-gray-600">{t('header.subtitle')}</p>
            </div>
            {/* Menu d'icônes + sélecteur de langue */}
            <div className="flex flex-row items-center gap-4 min-w-[120px]">
              <button
                className={`cursor-pointer flex flex-col items-center group transition-shadow duration-300 p-2 rounded-xl ${showCharts ? 'shadow-inner shadow-indigo-400/60 bg-white' : ''}`}
                onClick={() => setShowCharts(v => !v)}
                title={t('header.show_charts')}
                style={{ outline: 'none' }}
              >
                <FaChartBar className={`text-2xl  group-hover:text-indigo-800 transition ${showCharts ? 'scale-110' : ''}`} style={{color: "oklch(37.9% .146 265.522)"}} />
                <span className="text-xs text-gray-500 mt-1 cursor-pointer" >{t('header.charts')}</span>
              </button>
              <div className="relative">
                <button
                  className={`cursor-pointer flex flex-col items-center group transition-shadow duration-300 p-2 rounded-xl ${showDbMenu ? 'shadow-inner shadow-indigo-400/60 bg-white' : ''}`}
                  onClick={() => setShowDbMenu(v => !v)}
                  title={t('header.db_and_export')}
                  style={{ outline: 'none' }}
                >
                  <FaDatabase className="text-2xl group-hover:text-indigo-800 transition" style={{color: 'oklch(37.9% .146 265.522)'}} />
                  <span className="text-xs text-gray-500 mt-1 cursor-pointer">{t('header.database')}</span>
                </button>
                {showDbMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col p-2">
                    <button className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded" onClick={handleDownloadDB}>{t('header.download_db')}</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-green-50 rounded" onClick={handleUpdateDB}>{t('header.update_db')}</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-purple-50 rounded" onClick={handleExportPayments}>{t('header.export_payments')}</button>
                  </div>
                )}
              </div>
              <LanguageSelector />
            </div>
          </header>
          <div
            id="charts-visualisation"
            className={`transition-all duration-500 overflow-hidden ${showCharts ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className={`transition-all duration-500 ${showCharts ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
              {chartsVisible && (
                <>
                  <div className="flex flex-wrap gap-4 mb-4 items-end">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Début</label>
                      <input type="date" value={chartsDateStart} onChange={e => setChartsDateStart(e.target.value)} className="p-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Fin</label>
                      <input type="date" value={chartsDateEnd} onChange={e => setChartsDateEnd(e.target.value)} className="p-2 border border-gray-300 rounded" min={chartsDateStart} max={limitDate} />
                    </div>
                  </div>
                  <Charts payments={payments} dateStart={chartsDateStart} dateEnd={chartsDateEnd} />
                </>
              )}
            </div>
          </div>
          <PaymentsTable
            payments={payments}
            onEdit={handleEditPayment}
            onDelete={handleDeletePayment}
          />
        </div>
        {/* Modale export */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
                onClick={() => setShowExportModal(false)}
                title={t('modal.close')}
                tabIndex={0}
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-4 text-gray-800">{t('header.export_payments')}</h2>
              <form onSubmit={handleExportSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">{t('modal.date_start')}</label>
                  <input
                    type="date"
                    value={exportDates.start}
                    onChange={e => setExportDates({ ...exportDates, start: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">{t('modal.date_end')}</label>
                  <input
                    type="date"
                    value={exportDates.end}
                    onChange={e => setExportDates({ ...exportDates, end: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">{t('modal.format')}</label>
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
                  {t('modal.export')}
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
                {t('modal.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </I18nextProvider>
  );
};

export default App;
