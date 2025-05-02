import React from 'react';

export default function SidebarBudgetPeriod(props) {
  // Toutes les props nécessaires sont passées depuis Sidebar
  // On reprend le bloc JSX tel quel
  return (
    <>
      <hr className="my-4 border-gray-300 mt-6" />
      <h2 className="font-bold text-blue-800 mb-2 flex items-center gap-2" style={{ fontSize: "22px"}}><span>📅</span> Gestion de la période et du budget</h2>
      <div className="mt-6">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-gray-600 text-sm">Date limite&nbsp;:</span>
          <input
            type="date"
            value={props.limitDate}
            onChange={(e) => props.onSetLimit(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            style={{ minWidth: '140px' }}
          />
          <span className="flex items-center gap-2 ml-auto">
            <span className="text-gray-600 text-sm">Montant limite&nbsp;:</span>
            <input
              type="number"
              step="0.01"
              value={props.limitAmountInput}
              onChange={props.handleLimitAmountChange}
              onBlur={props.handleLimitAmountBlur}
              className="w-24 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              style={{ fontSize: '1rem' }}
            />
            <span className="text-gray-600">€</span>
          </span>
        </div>
        {/* Affichage du montant restant avant la limite */}
        {props.remainingBeforeLimit !== null && (
          <div className={`mt-2 text-sm font-semibold flex items-center gap-2 ${props.remainingBeforeLimit > 0 ? 'text-green-700' : 'text-red-700'}`}>
            <span>Montant restant avant la limite&nbsp;:</span>
            <span>{props.remainingBeforeLimit.toFixed(2)} €</span>
          </div>
        )}
        {/* Sélecteur de répartition et calcul du budget max par jour/semaine */}
        {props.remainingBeforeLimit !== null && props.remainingBeforeLimit > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-700 text-sm">Répartir par&nbsp;:</span>
              <select value={props.splitMode} onChange={e => props.setSplitMode(e.target.value)} className="p-1 border rounded">
                <option value="day">Jour</option>
                <option value="week">Semaine</option>
              </select>
              {props.splitMode === 'week' && (
                <>
                  <span className="ml-2 text-gray-700 text-sm">Début&nbsp;:</span>
                  <select value={props.splitStartDay} onChange={e => props.setSplitStartDay(e.target.value)} className="p-1 border rounded">
                    {props.weekDays.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </>
              )}
            </div>
            {/* Calcul du budget max par jour/semaine */}
            {(() => {
              if (!props.limitDate || props.remainingBeforeLimit == null) return null;
              const today = new Date();
              today.setHours(0,0,0,0);
              const limitDate = new Date(props.limitDate);
              limitDate.setHours(0,0,0,0);
              let nbUnits = 1;
              if (props.splitMode === 'day') {
                nbUnits = Math.max(1, Math.round((limitDate - today) / (1000*60*60*24)));
              } else if (props.splitMode === 'week') {
                // Trouver le prochain jour de la semaine sélectionné
                const weekDays = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
                const startDayIndex = weekDays.indexOf(props.splitStartDay);
                let firstTarget = new Date(today);
                let daysToAdd = (startDayIndex - today.getDay() + 7) % 7;
                if (daysToAdd === 0) {
                  // Si aujourd'hui est déjà le bon jour, on commence cette semaine
                } else {
                  firstTarget.setDate(today.getDate() + daysToAdd);
                }
                // Compter le nombre d'occurrences du jour choisi jusqu'à la date limite
                let count = 0;
                let d = new Date(firstTarget);
                while (d <= limitDate) {
                  count++;
                  d.setDate(d.getDate() + 7);
                }
                nbUnits = Math.max(1, count);
              }
              const budgetMax = props.remainingBeforeLimit / nbUnits;
              return (
                <div className="text-sm text-gray-700 mb-1">
                  Budget max par {props.splitMode === 'day' ? 'jour' : 'semaine'}&nbsp;: <span className="font-bold text-blue-700">{budgetMax.toFixed(2)} €</span>
                </div>
              );
            })()}
          </div>
        )}
        <hr className="my-4 border-gray-300" />
        {props.limitAlert && (
          <div className="mt-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded shadow text-sm flex items-center gap-2">
            <span role="img" aria-label="alerte">⚠️</span> {props.limitAlert}
          </div>
        )}
      </div>
    </>
  );
}
