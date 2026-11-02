import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  X,
  ChevronRight
} from 'lucide-react';

const ProductSpecsTable = ({ specifications, product = null }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Khóa cuộn trang khi Modal mở và hỗ trợ phím ESC để đóng
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isModalOpen]);

  // Chuẩn hóa và làm giàu (enrich) thông số kỹ thuật chi tiết
  const fullGroupedSections = useMemo(() => {
    const sections = [];

    // 1. Phân giải thông số kỹ thuật từ DB hoặc prop specifications
    if (Array.isArray(specifications) && specifications.length > 0) {
      if (specifications[0]?.specs && Array.isArray(specifications[0].specs)) {
        sections.push(...specifications);
      } else {
        const map = new Map();
        for (const item of specifications) {
          const groupName = item.spec_group || 'Hiệu Năng & Cấu Hình Phần Cứng';
          if (!map.has(groupName)) {
            map.set(groupName, []);
          }
          map.get(groupName).push({
            name: item.spec_name || item.name || 'Thông số',
            value: item.spec_value || item.value || '-'
          });
        }
        sections.push(...Array.from(map.entries()).map(([group, specs]) => ({ group, specs })));
      }
    } else if (
      specifications &&
      typeof specifications === 'object' &&
      Object.keys(specifications).length > 0
    ) {
      sections.push({
        group: 'Thông Số Kỹ Thuật Chính',
        specs: Object.entries(specifications).map(([name, val]) => ({
          name,
          value: typeof val === 'object' ? JSON.stringify(val) : String(val)
        }))
      });
    }

    // 2. Bổ sung nhóm "Thông Tin Xuất Xứ & Bảo Hành" nếu có thông tin sản phẩm
    if (product) {
      const generalSpecs = [];
      if (product.brand) {
        generalSpecs.push({ name: 'Thương hiệu / Hãng SX', value: product.brand });
      }
      if (product.model_code) {
        generalSpecs.push({ name: 'Mã Model / Part Number', value: product.model_code });
      }
      if (product.category_name) {
        generalSpecs.push({ name: 'Danh mục linh kiện', value: product.category_name });
      }
      if (product.warranty_months) {
        generalSpecs.push({
          name: 'Thời hạn bảo hành',
          value: `${product.warranty_months} tháng chính hãng (1 Đổi 1 trong 30 ngày nếu lỗi NSX)`
        });
      } else if (product.warranty_text) {
        generalSpecs.push({ name: 'Chính sách bảo hành', value: product.warranty_text });
      }
      generalSpecs.push({
        name: 'Tình trạng sản phẩm',
        value: 'Mới 100% nguyên seal tem phân phối ủy quyền tại Việt Nam'
      });
      generalSpecs.push({
        name: 'Quy cách đóng gói',
        value: 'Fullbox nguyên kiện NSX, kèm cáp kết nối, phụ kiện và tài liệu hướng dẫn'
      });

      // Nếu có biến thể (variants)
      if (Array.isArray(product.variants) && product.variants.length > 1) {
        const variantOptions = product.variants
          .map((v) => v.spec_version || v.color)
          .filter(Boolean);
        if (variantOptions.length > 0) {
          generalSpecs.push({
            name: 'Các tùy chọn phiên bản',
            value: variantOptions.join(' • ')
          });
        }
      }

      // Chỉ thêm nếu chưa có nhóm xuất xứ
      const hasGeneralGroup = sections.some((s) =>
        s.group.toLowerCase().includes('bảo hành') || s.group.toLowerCase().includes('xuất xứ')
      );
      if (!hasGeneralGroup && generalSpecs.length > 0) {
        sections.push({
          group: 'Xuất Xứ, Tiêu Chuẩn & Bảo Hành',
          specs: generalSpecs
        });
      }
    }

    // Nếu hoàn toàn không có thông số nào, tạo fallback tiêu chuẩn
    if (sections.length === 0 && product) {
      sections.push({
        group: 'Thông Tin Kỹ Thuật Cơ Bản',
        specs: [
          { name: 'Thương hiệu', value: product.brand || 'Chính hãng' },
          { name: 'Mã Model / SKU', value: product.model_code || 'Tiêu chuẩn NSX' },
          { name: 'Phân loại', value: product.category_name || 'Linh kiện máy tính' },
          { name: 'Thời hạn bảo hành', value: `${product.warranty_months || 24} tháng chính hãng` },
          { name: 'Tình trạng', value: 'Mới 100% nguyên seal tem phân phối ủy quyền' },
          { name: 'Phụ kiện đi kèm', value: 'Fullbox, cáp kết nối, sách hướng dẫn sử dụng' }
        ]
      });
    }

    return sections;
  }, [specifications, product]);

  // Tổng số lượng thông số kỹ thuật
  const totalSpecsCount = useMemo(() => {
    return fullGroupedSections.reduce((acc, curr) => acc + (curr.specs?.length || 0), 0);
  }, [fullGroupedSections]);

  const openSpecsModal = () => {
    setIsModalOpen(true);
  };

  const handleSpecsTriggerKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSpecsModal();
    }
  };

  if (fullGroupedSections.length === 0) {
    return null;
  }

  // Danh sách preview gọn trên trang chi tiết (tối đa 6 hàng để trang thoáng đẹp)
  let previewRowCount = 0;
  const PREVIEW_LIMIT = 6;
  const previewSections = [];
  for (const group of fullGroupedSections) {
    if (previewRowCount >= PREVIEW_LIMIT) break;
    const remainingSlots = PREVIEW_LIMIT - previewRowCount;
    const specsSlice = group.specs.slice(0, remainingSlots);
    previewSections.push({
      group: group.group,
      specs: specsSlice
    });
    previewRowCount += specsSlice.length;
  }

  return (
    <div className="space-y-4 pt-6 border-t border-slate-800">
      <div
        role="button"
        tabIndex={0}
        onClick={openSpecsModal}
        onKeyDown={handleSpecsTriggerKeyDown}
        aria-label={`Mở toàn bộ ${totalSpecsCount} thông số kỹ thuật`}
        className="rounded-2xl border border-slate-800 overflow-hidden shadow-sm bg-slate-900 outline-none cursor-pointer group/specs transition-all duration-300 hover:border-sky-500/50 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
        title="Nhấn để xem toàn bộ thông số kỹ thuật"
      >
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/45">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-100 uppercase tracking-wider font-mono">
                  Thông số kỹ thuật
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {totalSpecsCount} mục
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {previewRowCount < totalSpecsCount
                  ? `Hiển thị ${previewRowCount} thông số quan trọng`
                  : 'Thông tin kỹ thuật chính của sản phẩm'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-sky-400 shrink-0 transition-transform group-hover/specs:translate-x-1" />
        </div>

        <table className="w-full text-xs text-left">
          <tbody>
            {previewSections.map((section, sIdx) => (
              <React.Fragment key={section.group || sIdx}>
                {section.group && (
                  <tr className="bg-slate-800/90 border-b border-slate-700/80">
                    <td
                      colSpan={2}
                      className="py-2 px-4 font-bold text-sky-400 uppercase tracking-wider text-[10px] font-mono"
                    >
                      {section.group}
                    </td>
                  </tr>
                )}
                {section.specs?.map((spec, idx) => (
                  <tr
                    key={spec.name || idx}
                    className={
                      idx % 2 === 0
                        ? 'bg-slate-900 border-b border-slate-800/70 group-hover/specs:bg-slate-800/30 transition-colors'
                        : 'bg-slate-800/30 border-b border-slate-800/70 group-hover/specs:bg-slate-800/50 transition-colors'
                    }
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-300 w-2/5 sm:w-1/3 border-r border-slate-800/80 align-top">
                      {spec.name}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-100 font-mono align-top break-words">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-specs-title"
          className="dark-locked fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-4 sm:px-6 sm:py-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="product-specs-title"
                    className="text-sm sm:text-base font-extrabold text-slate-100 flex items-center gap-2"
                  >
                    <span>Thông số kỹ thuật</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono">
                      {totalSpecsCount} mục
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xl">
                    {product?.name || 'Chi tiết thông số phần cứng được ủy quyền'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer shrink-0"
                title="Đóng cửa sổ (ESC)"
                aria-label="Đóng thông số kỹ thuật"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-3 sm:p-5">
              <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="w-full text-xs sm:text-sm text-left">
                  <tbody>
                    {fullGroupedSections.map((section, sIdx) => (
                      <React.Fragment key={section.group || sIdx}>
                        {section.group && (
                          <tr className="bg-slate-800/90 border-b border-slate-700/80">
                            <td
                              colSpan={2}
                              className="py-2.5 px-4 text-sky-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] font-mono"
                            >
                              {section.group}
                            </td>
                          </tr>
                        )}
                        {section.specs?.map((spec, idx) => (
                          <tr
                            key={spec.name || idx}
                            className={
                              idx % 2 === 0
                                ? 'bg-slate-950 border-b border-slate-800/70'
                                : 'bg-slate-900/70 border-b border-slate-800/70'
                            }
                          >
                            <td className="py-3 px-4 font-bold text-slate-300 w-2/5 sm:w-1/3 border-r border-slate-800/80 align-top">
                              {spec.name}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-100 font-mono align-top leading-relaxed break-words whitespace-pre-wrap">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecsTable;
