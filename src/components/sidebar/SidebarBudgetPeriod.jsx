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
        {/* Sélecteur de répartition */}
        {props.remainingBeforeLimit !== null && props.remainingBeforeLimit > 0 && (
          (() => {
            let showBudgetGrise = false;
            if (props.budgetExceededDate && props.budgetReturnDate) {
              const today = new Date();
              today.setHours(0,0,0,0);
              if (today >= props.budgetExceededDate && today < props.budgetReturnDate) {
                showBudgetGrise = true;
              }
            }
            if (props.limitAlert && !showBudgetGrise) showBudgetGrise = true;
            return (
              <div className={`mt-3 p-3 border-l-4 rounded ${showBudgetGrise ? 'bg-gray-100 border-gray-300 opacity-60 pointer-events-none select-none' : 'bg-blue-50 border-blue-400'}`}>
                {showBudgetGrise ? (
                  <div className="text-sm text-gray-500 font-semibold">
                    Le budget sera disponible seulement à la date où le solde repassera au-dessus du montant limite.<br/>
                    {props.budgetReturnDate && (
                      <span className="block mt-1">Date de retour du budget&nbsp;: <span className="font-bold text-blue-700">{props.budgetReturnDate.toLocaleDateString('fr-FR')}</span></span>
                    )}
                    <span className="text-red-600 font-bold block mt-2">Toute dépense est fortement déconseillée.</span>
                  </div>
                ) : (
                  <>
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
                    {props.periodBudget !== null && props.budgetPeriod.start && props.budgetPeriod.end && (
                      <>
                        <div className="text-sm text-gray-700 mb-1">
                          Budget max par {props.splitMode === 'day' ? 'jour' : 'semaine'}&nbsp;: <span className="font-bold text-blue-700">{props.periodBudget.toFixed(2)} €</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Budget valable du {props.budgetPeriod.start.toLocaleDateString('fr-FR')} au {props.budgetPeriod.end.toLocaleDateString('fr-FR')} (J-1 avant nouvelle rentrée d'argent)
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()
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
