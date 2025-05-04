import { useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Title } from 'chart.js';
import { FaChartBar } from 'react-icons/fa';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import React from 'react';
import { useTranslation } from 'react-i18next';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Title);

function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
}

export default function Charts({ payments, dateStart, dateEnd }) {
  const { t } = useTranslation();

  // Détermine la plage de dates sélectionnée
  const start = dateStart ? new Date(dateStart) : null;
  const end = dateEnd ? new Date(dateEnd) : null;

  // Filtre les paiements dans la plage sélectionnée
  const filtered = payments.filter(p => {
    const d = new Date(p.sampling_date);
    return (!start || d >= start) && (!end || d <= end);
  });
  // Tri par date croissante
  const sorted = [...filtered].sort((a, b) => a.sampling_date.localeCompare(b.sampling_date));

  // Evolution du solde sur la plage sélectionnée
  let balance = 0;
  const balanceByDay = {};
  sorted.forEach((p) => {
    const label = new Date(p.sampling_date).toLocaleDateString('fr-FR');
    balance += p.amount;
    balanceByDay[label] = balance;
  });
  const days = Object.keys(balanceByDay);
  const balances = Object.values(balanceByDay);

  // Répartition par source (sur la plage)
  const sources = {};
  sorted.forEach((p) => {
    if (!sources[p.source]) sources[p.source] = 0;
    sources[p.source] += p.amount;
  });
  const sourceLabels = Object.keys(sources);
  const sourceData = Object.values(sources);

  // Répartition recettes/dépenses (sur la plage)
  const recettes = filtered.filter(p => p.amount >= 0).reduce((sum, p) => sum + p.amount, 0);
  const depenses = filtered.filter(p => p.amount < 0).reduce((sum, p) => sum + Math.abs(p.amount), 0);

  // Palette de couleurs pour chaque catégorie
  const categoryColors = {
    'Loyer': '#a78bfa',
    'Alimentation': '#4ade80',
    'Loisirs': '#f472b6',
    'Transports': '#fde047',
    'Santé': '#f87171',
    'Abonnements': '#60a5fa',
    'Impôts': '#fb923c',
    'Divers': '#6b7280',
    'Salaires': '#34d399',
    'Crédit': '#22d3ee',
  };

  // Répartition par catégorie (sur la plage)
  const categories = {};
  filtered.forEach((p) => {
    const cat = p.category || 'Divers';
    if (!categories[cat]) categories[cat] = 0;
    categories[cat] += p.amount;
  });
  const categoryLabels = Object.keys(categories);
  const categoryData = Object.values(categories).map(v => Math.abs(v));
  const categoryBgColors = categoryLabels.map(cat => categoryColors[cat] || '#6b7280');

  return (
    <div className="mb-2">
      <div className="flex flex-row items-center gap-2 mb-4">
        <FaChartBar className="text-2xl text-indigo-600" />
      </div>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Évolution du solde */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2 text-center">{t('evolution_solde')}</h3>
            <Line
              data={{
                labels: days,
                datasets: [{
                  label: t('solde'),
                  data: balances,
                  borderColor: '#6366f1',
                  backgroundColor: 'rgba(99,102,241,0.1)',
                  tension: 0.3,
                  fill: true,
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
          {/* Répartition par source */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2 text-center">{t('repartition_source')}</h3>
            <Bar
              data={{
                labels: sourceLabels,
                datasets: [{
                  label: t('montant'),
                  data: sourceData,
                  backgroundColor: '#6366f1',
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                indexAxis: 'y',
                scales: { x: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recettes vs Dépenses */}
          <div className="bg-white rounded-lg shadow p-4 max-w-[320px] mx-auto">
            <h3 className="font-bold mb-2 text-center">{t('recettes_vs_depenses')}</h3>
            <Pie
              data={{
                labels: [t('recettes'), t('depenses')],
                datasets: [{
                  data: [recettes, depenses],
                  backgroundColor: ['#22c55e', '#ef4444'],
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
              }}
            />
          </div>
          {/* Répartition par catégorie */}
          <div className="bg-white rounded-lg shadow p-4 max-w-[320px] mx-auto">
            <h3 className="font-bold mb-2 text-center">{t('repartition_categorie')}</h3>
            <Pie
              data={{
                labels: categoryLabels,
                datasets: [{
                  data: categoryData,
                  backgroundColor: categoryBgColors,
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
