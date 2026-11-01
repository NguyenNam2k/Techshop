import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Maximize2,
  X,
  Search,
  Sparkles,
  ShieldCheck,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';

const ProductSpecsTable = ({ specifications, product = null }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroupFilter, setActiveGroupFilter] = useState('all');

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

  // Bộ lọc thông số trong Modal theo từ khóa và nhóm
  const filteredModalSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return fullGroupedSections
      .map((section) => {
        // Kiểm tra filter theo nhóm
        if (activeGroupFilter !== 'all' && section.group !== activeGroupFilter) {
          return null;
        }

        // Lọc specs theo từ khóa
        const matchedSpecs = (section.specs || []).filter((s) => {
          if (!q) return true;
          return s.name.toLowerCase().includes(q) || s.value.toLowerCase().includes(q);
        });

        if (matchedSpecs.length === 0) return null;
        return {
          ...section,
          specs: matchedSpecs
        };
      })
      .filter(Boolean);
  }, [fullGroupedSections, searchQuery, activeGroupFilter]);

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
      {/* Header khu vực bảng thông số */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-extrabold text-slate-100 uppercase tracking-wider font-mono">
            Thông Số Kỹ Thuật Chi Tiết
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {totalSpecsCount} mục
          </span>
        </div>

        {/* Nút mở Modal xem toàn bộ thông số kỹ thuật đầy đủ */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 hover:text-sky-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 group/btn"
          title="Nhấn để mở cửa sổ xem toàn bộ thông số chi tiết"
        >
          <Maximize2 className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
          <span>Xem chi tiết đầy đủ</span>
        </button>
      </div>

      {/* Bảng xem trước trên trang - Có thể nhấn trực tiếp vào bảng để mở Modal */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="rounded-2xl border border-slate-800 hover:border-sky-500/50 overflow-hidden shadow-sm bg-slate-900 transition-all duration-300 cursor-pointer group relative"
        title="Nhấn vào đây để xem toàn bộ thông số kỹ thuật chi tiết"
      >
        <table className="w-full text-xs text-left">
          <tbody>
            {previewSections.map((section, sIdx) => (
              <React.Fragment key={section.group || sIdx}>
                {section.group && (
                  <tr className="bg-slate-800/90 border-b border-slate-700/80">
                    <td
                      colSpan={2}
                      className="py-2.5 px-4 font-bold text-sky-400 uppercase tracking-wider text-[11px] font-mono flex items-center justify-between"
                    >
                      <span>• {section.group}</span>
                      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                        Nhấn để xem đầy đủ ↗
                      </span>
                    </td>
                  </tr>
                )}
                {section.specs?.map((spec, idx) => (
                  <tr
                    key={spec.name || idx}
                    className={
                      idx % 2 === 0
                        ? 'bg-slate-900 border-b border-slate-800/70 group-hover:bg-slate-800/30 transition-colors'
                        : 'bg-slate-800/30 border-b border-slate-800/70 group-hover:bg-slate-800/50 transition-colors'
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

        {/* Thanh gợi ý mở rộng dưới bảng */}
        <div className="py-3 px-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 group-hover:text-sky-400 transition-colors">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Đang hiển thị {previewRowCount}/{totalSpecsCount} thông số quan trọng
            </span>
          </span>
          <span className="font-bold flex items-center gap-1 text-sky-400">
            Xem toàn bộ {totalSpecsCount} thông số kỹ thuật
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL CHI TIẾT THÔNG SỐ KỸ THUẬT (POPUP TOÀN MÀN HÌNH)                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* 1. Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-100 flex items-center gap-2">
                    <span>Bảng Thông Số Kỹ Thuật Chi Tiết</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono">
                      {totalSpecsCount} mục
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xl">
                    {product?.name || 'Chi tiết thông số phần cứng được ủy quyền'}
                  </p>
                </div>
              </div>

              {/* Nút đóng Modal */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer shrink-0"
                title="Đóng cửa sổ (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Thanh tìm kiếm và bộ lọc nhanh theo nhóm trong Modal */}
            <div className="p-4 sm:px-6 bg-slate-900 border-b border-slate-800 space-y-3">
              {/* Ô gõ tìm kiếm */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm thông số (ví dụ: GPU, VRAM, RAM, Cổng kết nối, Công suất, Bảo hành...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-100 absolute right-2.5 transition"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Nhóm Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveGroupFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer border ${
                    activeGroupFilter === 'all'
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-100'
                  }`}
                >
                  Tất cả ({totalSpecsCount})
                </button>
                {fullGroupedSections.map((group) => (
                  <button
                    key={group.group}
                    type="button"
                    onClick={() => setActiveGroupFilter(group.group)}
                    className={`px-3 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer border ${
                      activeGroupFilter === group.group
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-100'
                    }`}
                  >
                    {group.group} ({group.specs.length})
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Bảng nội dung cuộn bên trong Modal */}
            <div className="overflow-y-auto max-h-[55vh] p-4 sm:p-6 space-y-6">
              {filteredModalSections.length === 0 ? (
                <div className="p-8 text-center space-y-2 bg-slate-950 rounded-2xl border border-slate-800">
                  <Filter className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-200">Không tìm thấy thông số nào</p>
                  <p className="text-xs text-slate-400">
                    Không có thông số nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveGroupFilter('all');
                    }}
                    className="mt-2 text-xs font-bold text-sky-400 hover:underline cursor-pointer"
                  >
                    Xóa bộ lọc để xem lại toàn bộ
                  </button>
                </div>
              ) : (
                filteredModalSections.map((section, sIdx) => (
                  <div
                    key={section.group || sIdx}
                    className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-xs"
                  >
                    {/* Nhãn nhóm */}
                    <div className="py-2.5 px-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
                      <span className="font-extrabold text-sky-400 uppercase tracking-wider text-xs font-mono flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{section.group}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {section.specs.length} thông số
                      </span>
                    </div>

                    {/* Danh sách thông số dạng bảng chi tiết */}
                    <table className="w-full text-xs text-left">
                      <tbody>
                        {section.specs.map((spec, idx) => (
                          <tr
                            key={spec.name || idx}
                            className={
                              idx % 2 === 0
                                ? 'bg-slate-950 border-b border-slate-800/70 hover:bg-slate-900/80 transition-colors'
                                : 'bg-slate-900/40 border-b border-slate-800/70 hover:bg-slate-900/80 transition-colors'
                            }
                          >
                            <td className="py-3 px-4 font-bold text-slate-300 w-2/5 sm:w-1/3 border-r border-slate-800/80 align-top">
                              {spec.name}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-100 font-mono align-top leading-relaxed break-words">
                              {spec.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>

            {/* 4. Modal Footer */}
            <div className="p-4 sm:px-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Thông số kỹ thuật chính thức được chứng nhận và công bố bởi nhà sản xuất.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 font-bold text-xs transition cursor-pointer shadow-xs ml-auto"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSpecsTable;
