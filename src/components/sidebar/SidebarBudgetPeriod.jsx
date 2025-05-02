import React from 'react';

export default function SidebarBudgetPeriod(props) {
  // Toutes les props nécessaires sont passées depuis Sidebar
  return (
    <div className="card bg-base-100 shadow-md mt-6">
      <div className="card-body p-5">
        <h2 className="card-title text-blue-800 text-xl mb-4 flex items-center gap-2"><span>📅</span> Gestion de la période et du budget</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-blue-800 text-sm font-semibold">Date limite&nbsp;:</span>
            <input
              type="date"
              value={props.limitDate}
              onChange={(e) => props.onSetLimit(e.target.value)}
              className="input input-bordered input-sm w-36 max-w-xs  bg-blue-50 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-blue-900 px-3 py-2"
            />
            <span className="flex items-center gap-2 ml-auto">
              <span className="text-blue-800 text-sm font-semibold">Montant limite&nbsp;:</span>
              <input
                type="number"
                step="0.01"
                value={props.limitAmountInput}
                onChange={props.handleLimitAmountChange}
                onBlur={props.handleLimitAmountBlur}
                className="input input-bordered input-sm w-24 text-right bg-blue-50 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-blue-900 px-3 py-2"
              />
              <span className="text-gray-600">€</span>
            </span>
          </div>

          {/* Affichage du montant restant avant la limite */}
          {props.remainingBeforeLimit !== null && (
            <div className={`alert ${props.remainingBeforeLimit > 0 ? 'alert-success' : 'alert-error'} py-2 px-3 flex items-center gap-2 text-sm font-semibold`}>
              <span>Montant restant avant la limite&nbsp;:</span>
              <span>{props.remainingBeforeLimit.toFixed(2)} €</span>
            </div>
          )}

          {/* Sélecteur de répartition et calcul du budget max par jour/semaine */}
          {props.remainingBeforeLimit !== null && props.remainingBeforeLimit > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-700 text-sm">Répartir par&nbsp;:</span>
                <select value={props.splitMode} onChange={e => props.setSplitMode(e.target.value)} className="select select-bordered select-xs">
                  <option value="day">Jour</option>
                  <option value="week">Semaine</option>
                </select>
                {props.splitMode === 'week' && (
                  <>
                    <span className="ml-2 text-gray-700 text-sm">Début&nbsp;:</span>
                    <select value={props.splitStartDay} onChange={e => props.setSplitStartDay(e.target.value)} className="select select-bordered select-xs">
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
                  <div className="text-sm text-blue-700 mb-1">
                    Budget max par {props.splitMode === 'day' ? 'jour' : 'semaine'}&nbsp;: <span className="font-bold">{budgetMax.toFixed(2)} €</span>
                  </div>
                );
              })()}
            </div>
          )}

          {props.limitAlert && (
            <div className="alert alert-warning py-2 px-3 flex items-center gap-2 text-sm mt-2">
              <span role="img" aria-label="alerte">⚠️</span> {props.limitAlert}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
