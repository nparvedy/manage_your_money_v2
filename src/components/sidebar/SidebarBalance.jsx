import React from 'react';
import { useTranslation } from 'react-i18next';

export default function SidebarBalance({ balance }) {
  const { t, i18n } = useTranslation();
  const isThai = i18n.language === 'th';
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-2 justify-between px-4 py-3 rounded-lg shadow-inner bg-white" style={{boxShadow: 'inset 0 2px 12px 0 rgba(0,0,0,0.08)'}}>
        <div className="flex items-center gap-2">
          <span className={isThai ? "text-2xl md:text-3xl drop-shadow-sm" : "text-3xl md:text-4xl drop-shadow-sm"}>💰</span>
          <span className={isThai ? "text-lg font-bold text-gray-700" : "text-xl font-bold text-gray-700"}>{t('sidebar.solde')}</span>
        </div>
        <div className="flex items-center gap-0">
          <span className="h-9 w-px bg-gray-300 mx-3"></span>
          <div className={`${isThai ? "text-2xl md:text-2xl" : "text-3xl md:text-3xl"} font-extrabold px-6 py-3 rounded-lg  ${balance >= 0 ? 'text-green-700  bg-green-50' : 'text-red-700  bg-red-50'} flex items-center justify-center`} style={{letterSpacing: '0.5px', fontFamily: 'inherit', minWidth: '140px'}}>
            {Number(balance).toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  );
}
