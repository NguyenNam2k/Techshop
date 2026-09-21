import React from 'react';
import { Cpu } from 'lucide-react';

const ProductSpecsTable = ({ specifications }) => {
  if (!specifications || specifications.length === 0) {
    return null;
  }

  const isArray = Array.isArray(specifications);

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
        <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        Thông Số Kỹ Thuật Chi Tiết
      </h3>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900 transition-colors">
        <table className="w-full text-xs text-left">
          <tbody>
            {isArray ? (
              specifications.map((section, sIdx) => (
                <React.Fragment key={section.group || sIdx}>
                  {section.group && (
                    <tr className="bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan={2} className="py-2.5 px-4 font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider text-[11px] font-mono">
                        ❖ {section.group}
                      </td>
                    </tr>
                  )}
                  {section.specs?.map((spec, idx) => (
                    <tr
                      key={spec.name || idx}
                      className={
                        idx % 2 === 0
                          ? 'bg-[#FFFFFF] dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          : 'bg-[#F8FAFC] dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-1/3 border-r border-slate-100 dark:border-slate-800">
                        {spec.name}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400 font-mono">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              Object.entries(specifications).map(([key, val], idx) => (
                <tr
                  key={key}
                  className={
                    idx % 2 === 0
                      ? 'bg-[#FFFFFF] dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      : 'bg-[#F8FAFC] dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }
                >
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-1/3 border-r border-slate-100 dark:border-slate-800">
                    {key}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400 font-mono">
                    {val}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSpecsTable;