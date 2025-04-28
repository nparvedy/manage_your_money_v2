import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import PaymentsTable from './components/PaymentsTable';
import Charts from './components/Charts';

const App = () => {
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [limitDate, setLimitDate] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);

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
        <header className="mb-2">
          <h1 className="text-4xl font-extrabold text-gray-800">Gestion des Paiements</h1>
          <p className="text-gray-600">Gérez vos paiements et suivez vos finances facilement.</p>
        </header>
        <Charts payments={payments} />
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
