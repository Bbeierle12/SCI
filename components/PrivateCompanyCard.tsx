import React from 'react';
import { Lock, Box } from 'lucide-react';
import { PrivateCompany } from '../types';

export const PrivateCompanyCard: React.FC<{ company: PrivateCompany }> = ({ company }) => {
  return (
    <div className="bg-gray-900/30 border border-gray-800 border-dashed rounded-xl p-5 flex flex-col justify-between h-full hover:bg-gray-900 hover:border-gray-700 transition-all duration-300 group">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-gray-300 flex items-center gap-2 group-hover:text-white transition-colors">
            {company.name}
            <Lock className="w-3 h-3 text-gray-600" />
          </h3>
          <span className="text-xs font-bold bg-gray-800 text-gray-400 px-2 py-1 rounded uppercase tracking-wider">
            {company.status}
          </span>
        </div>
        <p className="text-gray-500 text-xs mb-4 font-mono">Owners: <span className="text-gray-400">{company.owners}</span></p>
        <p className="text-gray-400 text-sm leading-relaxed">{company.description}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-800/50 flex items-center gap-2">
        <Box className="w-3.5 h-3.5 text-purple-500" />
        <span className="text-xs font-semibold text-purple-300">{company.role}</span>
      </div>
    </div>
  );
};