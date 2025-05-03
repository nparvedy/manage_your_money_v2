import React from 'react';
import { FaPaperclip } from 'react-icons/fa';

export default function AddPaymentForm(props) {
  // On récupère toutes les props du parent Sidebar
  return (
    <>
      {/* Formulaire amélioré EN PREMIER */}
      <h2 className="text-2xl font-bold text-blue-900 mb-2 mt-3 flex items-center gap-3 tracking-wide border-b-2 border-blue-200 pb-2  from-blue-100 to-white rounded-t-lg ">
        <span className="text-3xl">💳</span> Formulaire d'ajout de paiement
      </h2>
      <form onSubmit={props.handleSubmit} className="space-y-3 mb-8 shadow-lg rounded-xl bg-white p-4">
        <div className="flex gap-2">
          <div className="flex-[1.1] min-w-0">
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <div className="relative">
              <input
                type="text"
                id="source"
                name="source"
                placeholder="Source"
                value={props.formData.source}
                onChange={props.handleChange}
                onFocus={() => props.setShowSuggestions(props.suggestions.length > 0)}
                onBlur={() => setTimeout(() => props.setShowSuggestions(false), 120)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoComplete="off"
                required
                style={{ fontSize: '0.95rem', padding: '0.45rem 0.5rem' }}
              />
              {props.showSuggestions && (
                <ul className="absolute left-0 right-0 bg-white border border-gray-300 rounded-lg shadow z-20 max-h-40 overflow-y-auto mt-1">
                  {props.suggestions.map((s, idx) => (
                    <li
                      key={s + idx}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      onMouseDown={() => props.handleSuggestionClick(s)}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex-[0.9] min-w-0">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <div className="flex items-center gap-1">
              {/* Boutons + et - pour le signe */}
              <button
                type="button"
                onClick={() => props.setAmountSign(1)}
                className={`px-1.5 py-0.5 rounded-full border-2 text-base font-bold focus:outline-none transition-colors ${props.amountSign === 1 ? 'bg-green-100 border-green-600 text-green-700' : 'bg-white border-gray-300 text-gray-400 hover:bg-green-50'}`}
                tabIndex={-1}
                title="Entrée (positif)"
                style={{ minWidth: 28, minHeight: 28, lineHeight: '1.1' }}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => props.setAmountSign(-1)}
                className={`px-1.5 py-0.5 rounded-full border-2 text-base font-bold focus:outline-none transition-colors ${props.amountSign === -1 ? 'bg-red-100 border-red-600 text-red-700' : 'bg-white border-gray-300 text-gray-400 hover:bg-red-50'}`}
                tabIndex={-1}
                title="Sortie (négatif)"
                style={{ minWidth: 28, minHeight: 28, lineHeight: '1.1' }}
              >
                -
              </button>
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="Montant"
                value={props.formData.amount}
                onChange={props.handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ml-2"
                step="0.01"
                required
                min="0"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="sampling_date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="sampling_date"
              name="sampling_date"
              value={props.formData.sampling_date}
              onChange={props.handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
              required
            />
          </div>
          <div className="w-32">
            <label htmlFor="months" className="block text-sm font-medium text-gray-700 mb-1">Mois répé.</label>
            <input
              type="number"
              id="months"
              name="months"
              placeholder="Mois"
              value={props.formData.months}
              onChange={props.handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              id="category"
              name="category"
              value={props.formData.category || ''}
              onChange={props.handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value="" disabled>Catégorie</option>
              {props.categories.map(cat => (
                <option key={cat} value={cat} className={props.categoryColors[cat] || ''}>
                  {props.categoryIcons[cat] ? `${props.categoryIcons[cat]} ` : ''}{cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-start ml-2">
            <input
              type="file"
              id="attachment"
              name="attachment"
              accept="image/*,application/pdf"
              onChange={props.handleFileChange}
              className="hidden"
            />
            <label htmlFor="attachment" className="text-indigo-900 hover:text-indigo-900 p-0 m-0 align-middle cursor-pointer" title="Ajouter ou remplacer la pièce jointe" style={{ background: 'none', border: 'none' }}>
              <FaPaperclip className="inline text-2xl align-middle pb-1" />
            </label>
            {props.attachmentName && (
              <span
                className="text-xs text-gray-500 truncate max-w-[90px] group-hover:underline relative mt-1"
                style={{ verticalAlign: 'middle' }}
                title={props.attachmentName}
              >
                {props.attachmentName}
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-base rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 font-semibold min-w-[120px] text-center transition-all duration-150">
                  {props.attachmentName}
                </span>
              </span>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 text-base cursor-pointer"
        >
          Enregistrer
        </button>
        {props.editingPayment && (
          <button
            type="button"
            onClick={() => {
              props.setFormData({
                id: '',
                source: '',
                amount: '',
                sampling_date: new Date().toISOString().split('T')[0],
                months: '1',
                pause: false,
                category: '',
                attachment: null,
              });
              props.setAttachmentName('');
              props.onCancel();
              props.setInfoModal({ show: true, message: 'Modification annulée.', type: 'info' });
            }}
            className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300 text-base"
          >
            Annuler
          </button>
        )}
      </form>
    </>
  );
}
