import ProductCard from './ProductCard';

function ProductGrid({ products, loading, onResetFilters }) {
  // Skeleton Loading State
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="motion-shimmer bg-slate-800 rounded-2xl border border-slate-700/60 p-3 sm:p-4 h-72 sm:h-80 animate-pulse flex flex-col justify-between"
          >
            <div className="w-full h-40 bg-slate-700/60 rounded-xl" />
            <div className="space-y-2 mt-4">
              <div className="w-16 h-3 bg-slate-700/60 rounded" />
              <div className="w-full h-4 bg-slate-700/60 rounded" />
              <div className="w-2/3 h-4 bg-slate-700/60 rounded" />
            </div>
            <div className="pt-3 border-t border-slate-700/40 flex justify-between items-center">
              <div className="w-24 h-5 bg-slate-700/60 rounded" />
              <div className="w-8 h-8 bg-slate-700/60 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (!products || products.length === 0) {
    return (
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-12 text-center flex flex-col items-center justify-center my-6">
        <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center text-4xl mb-4">
          🔎
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Không tìm thấy sản phẩm nào!</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
          Không có sản phẩm nào phù hợp với bộ lọc hoặc từ khóa bạn đang tìm kiếm. Hãy thử bỏ bớt điều kiện lọc hoặc gõ từ khóa khác.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            🔄 Xóa tất cả bộ lọc
          </button>
        )}
      </div>
    );
  }

  // Render Grid
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductGrid;
