import React, { useState, useMemo } from 'react';
import { Cpu, Check, Copy } from 'lucide-react';

const ProductSpecsTable = ({ specifications, product = null }) => {
  const [copied, setCopied] = useState(false);

  // Parse specifications into a standardized grouped structure: [{ group, specs: [{ name, value }] }]
  const groupedSections = useMemo(() => {
    if (Array.isArray(specifications) && specifications.length > 0) {
      // 1. Case A: Already nested format [{ group: '...', specs: [...] }]
      if (specifications[0]?.specs && Array.isArray(specifications[0].specs)) {
        return specifications;
      }

      // 2. Case B: Flat DB format [{ spec_group, spec_name, spec_value }]
      const map = new Map();
      for (const item of specifications) {
        const groupName = item.spec_group || 'Thông số chi tiết';
        if (!map.has(groupName)) {
          map.set(groupName, []);
        }
        map.get(groupName).push({
          name: item.spec_name || item.name || 'Thông số',
          value: item.spec_value || item.value || '-'
        });
      }
      return Array.from(map.entries()).map(([group, specs]) => ({ group, specs }));
    }

    // 3. Case C: Key-Value Dictionary { 'CPU': 'i9-14900K', 'RAM': '32GB' }
    if (specifications && typeof specifications === 'object' && Object.keys(specifications).length > 0) {
      return [
        {
          group: 'Thông số kỹ thuật',
          specs: Object.entries(specifications).map(([name, val]) => ({
            name,
            value: typeof val === 'object' ? JSON.stringify(val) : String(val)
          }))
        }
      ];
    }

    // 4. Case D: Fallback to product basic info if specifications table has no rows
    if (product) {
      return [
        {
          group: 'Thông tin kỹ thuật cơ bản',
          specs: [
            { name: 'Thương hiệu', value: product.brand || 'Chính hãng' },
            { name: 'Mã Model / Part Number', value: product.model_code || 'Tiêu chuẩn NSX' },
            { name: 'Thời hạn bảo hành', value: `${product.warranty_months || 24} tháng chính hãng` },
            { name: 'Tình trạng sản phẩm', value: 'Mới 100% nguyên seal tem phân phối ủy quyền' },
            { name: 'Phụ kiện đi kèm', value: 'Fullbox, cáp kết nối, hướng dẫn sử dụng và phiếu bảo hành' }
          ]
        }
      ];
    }

    return [];
  }, [specifications, product]);

  const handleCopySpecs = () => {
    if (groupedSections.length === 0) return;
    const textLines = [];
    groupedSections.forEach((section) => {
      textLines.push(`[${section.group}]`);
      section.specs.forEach((s) => {
        textLines.push(`- ${s.name}: ${s.value}`);
      });
      textLines.push('');
    });
    navigator.clipboard?.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (groupedSections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-6 border-t border-slate-800">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-extrabold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          <span>Thông Số Kỹ Thuật Chi Tiết</span>
        </h3>

        <button
          type="button"
          onClick={handleCopySpecs}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Sao chép toàn bộ thông số kỹ thuật"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Sao chép thông số</span>
            </>
          )}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-sm bg-slate-900">
        <table className="w-full text-xs text-left">
          <tbody>
            {groupedSections.map((section, sIdx) => (
              <React.Fragment key={section.group || sIdx}>
                {section.group && (
                  <tr className="bg-slate-800/90 border-b border-slate-700/80">
                    <td
                      colSpan={2}
                      className="py-2.5 px-4 font-bold text-sky-400 uppercase tracking-wider text-[11px] font-mono"
                    >
                      • {section.group}
                    </td>
                  </tr>
                )}
                {section.specs?.map((spec, idx) => (
                  <tr
                    key={spec.name || idx}
                    className={
                      idx % 2 === 0
                        ? 'bg-slate-900 border-b border-slate-800/70 hover:bg-slate-800/40 transition-colors'
                        : 'bg-slate-800/30 border-b border-slate-800/70 hover:bg-slate-800/40 transition-colors'
                    }
                  >
                    <td className="py-3 px-4 font-bold text-slate-300 w-2/5 sm:w-1/3 border-r border-slate-800/80 align-top">
                      {spec.name}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 font-mono align-top break-words">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSpecsTable;
