import React from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';

const ProductSpecsTable = ({ specifications }) => {
  if (!specifications || specifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm md:text-base tracking-wide">
            Thông Số Kỹ Thuật
          </h3>
        </div>       
      </div>

      <div className="divide-y divide-slate-800/80">
        {specifications.map((section) => (
          <div key={section.group} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                {section.group}
              </h4>
            </div>

            <div className="space-y-1.5">
              {section.specs.map((spec, specIndex) => (
                <div 
                  key={spec.name} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3 rounded-lg transition-colors
                    ${specIndex % 2 === 0 ? 'bg-slate-900/40' : 'bg-transparent'}
                    hover:bg-slate-800/60
                  `}
                >
                  <span className="text-slate-400 font-medium sm:w-1/2">{spec.name}</span>
                  <span className="font-mono text-slate-100 font-semibold sm:w-1/2 sm:text-right mt-0.5 sm:mt-0 text-cyan-100">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSpecsTable;