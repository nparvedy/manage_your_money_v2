import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import PaymentsTable from './components/PaymentsTable';
import Charts from './components/Charts';
import { FaChartBar } from 'react-icons/fa';

const App = () => {
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [limitDate, setLimitDate] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [chartsVisible, setChartsVisible] = useState(false);
  const [chartsDateStart, setChartsDateStart] = useState('');
  const [chartsDateEnd, setChartsDateEnd] = useState('');

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

  return (
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
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800">Gestion des Paiements</h1>
            <p className="text-gray-600">Gérez vos paiements et suivez vos finances facilement.</p>
          </div>
          {/* Menu d'icônes */}
          <div className="flex flex-col items-center gap-2 min-w-[60px]">
            <button
              className={`flex flex-col items-center group transition-shadow duration-300 p-2 rounded-xl ${showCharts ? 'shadow-inner shadow-indigo-400/60 bg-white' : ''}`}
              onClick={() => setShowCharts(v => !v)}
              title="Afficher les graphiques"
              style={{ outline: 'none' }}
            >
              <FaChartBar className={`text-2xl text-indigo-600 group-hover:text-indigo-800 transition ${showCharts ? 'scale-110' : ''}`} />
              <span className="text-xs text-gray-500 mt-1">Graphique</span>
            </button>
            {/* D'autres icônes pourront être ajoutées ici */}
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
    </div>
  );
};

export default App;
