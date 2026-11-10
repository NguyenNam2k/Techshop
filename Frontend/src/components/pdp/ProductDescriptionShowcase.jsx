import React, { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X, ZoomIn } from 'lucide-react';

const ProductDescriptionShowcase = ({ product }) => {
  const [activeTab, setActiveTab] = useState('description');
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const sectionRef = useRef(null);

  const specificationSections = useMemo(() => {
    if (!product) return [];

    const sections = [];
    if (Array.isArray(product.specifications)) {
      if (product.specifications[0]?.specs) {
        sections.push(...product.specifications);
      } else {
        const grouped = new Map();
        product.specifications.forEach((spec) => {
          const group = spec.spec_group || 'Thông số kỹ thuật';
          if (!grouped.has(group)) grouped.set(group, []);
          grouped.get(group).push({
            name: spec.spec_name || spec.name || 'Thông số',
            value: spec.spec_value || spec.value || '-'
          });
        });
        sections.push(...Array.from(grouped, ([group, specs]) => ({ group, specs })));
      }
    } else if (product.specifications && typeof product.specifications === 'object') {
      sections.push({
        group: 'Thông số kỹ thuật',
        specs: Object.entries(product.specifications).map(([name, value]) => ({
          name,
          value: String(value)
        }))
      });
    }

    const productInfo = [
      product.brand && { name: 'Thương hiệu', value: product.brand },
      product.model_code && { name: 'Model', value: product.model_code },
      product.category_name && { name: 'Danh mục', value: product.category_name },
      product.warranty_months && {
        name: 'Bảo hành',
        value: `${product.warranty_months} tháng chính hãng`
      }
    ].filter(Boolean);

    if (productInfo.length > 0) {
      sections.push({ group: 'Thông tin sản phẩm', specs: productInfo });
    }

    return sections;
  }, [product]);

  if (!product) return null;

  const showcaseImages = (product.images || []).filter((image) => image.image_url);
  const hasPlaceholderDescription = /mock|kiểm thử|tồn kho mẫu/i.test(product.description || '');
  const paragraphs = hasPlaceholderDescription
    ? []
    : String(product.description || '')
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
  const description =
    paragraphs.length > 0
      ? paragraphs
      : [
          `${product.name} là lựa chọn phù hợp cho nhu cầu sử dụng ${(
            product.category_name || 'máy tính'
          ).toLowerCase()}. Sản phẩm được giới thiệu cùng thông số kỹ thuật rõ ràng để bạn dễ dàng đối chiếu trước khi đặt mua.`
        ];

  const handleToggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="product-description-showcase"
      className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('specifications')}
          className={`relative px-4 py-4 text-sm font-semibold transition-colors sm:text-base ${
            activeTab === 'specifications'
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Thông số kỹ thuật
          {activeTab === 'specifications' && (
            <span className="absolute inset-x-5 bottom-0 h-0.5 bg-sky-600 dark:bg-sky-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('description')}
          className={`relative px-4 py-4 text-sm font-semibold transition-colors sm:text-base ${
            activeTab === 'description'
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Chi tiết sản phẩm
          {activeTab === 'description' && (
            <span className="absolute inset-x-5 bottom-0 h-0.5 bg-sky-600 dark:bg-sky-400" />
          )}
        </button>
      </div>

      <div
        className={`relative px-4 py-5 sm:px-6 ${
          !isExpanded ? 'max-h-[620px] overflow-hidden' : ''
        }`}
      >
        {activeTab === 'specifications' ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {specificationSections.length > 0 ? (
              specificationSections.map((section, sectionIndex) => (
                <div key={`${section.group}-${sectionIndex}`}>
                  <h3 className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                    {section.group}
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(section.specs || []).map((spec, specIndex) => (
                      <div
                        key={`${spec.name}-${specIndex}`}
                        className="grid grid-cols-1 gap-1 px-4 py-3 text-sm sm:grid-cols-[minmax(160px,35%)_1fr] sm:gap-4"
                      >
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          {spec.name}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-sm text-slate-500">Chưa có thông số kỹ thuật.</p>
            )}
          </div>
        ) : (
          <article className="prose prose-slate max-w-none text-[15px] leading-7 dark:prose-invert">
            <p className="!mt-0">
              <strong className="text-sky-600 dark:text-sky-400">{product.name}</strong>{' '}
              mang đến cấu hình và trải nghiệm phù hợp cho nhu cầu sử dụng thực tế. Dưới đây là
              thông tin chi tiết giúp bạn hiểu rõ hơn về sản phẩm trước khi lựa chọn.
            </p>

            {description.map((paragraph, index) => (
              <React.Fragment key={`paragraph-${index}`}>
                <p>{paragraph}</p>
                {showcaseImages[index] && (
                  <figure className="my-7">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(showcaseImages[index])}
                      className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg bg-slate-50 p-2 dark:bg-slate-800"
                    >
                      <img
                        src={showcaseImages[index].image_url}
                        alt={showcaseImages[index].angle_label || `${product.name} - hình ảnh ${index + 1}`}
                        className="mx-auto max-h-[560px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                        loading="lazy"
                      />
                      <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-slate-900/90 dark:text-slate-200">
                        <ZoomIn className="h-3.5 w-3.5" /> Phóng to
                      </span>
                    </button>
                    {showcaseImages[index].angle_label && (
                      <figcaption className="mt-2 text-center text-xs italic text-slate-500 dark:text-slate-400">
                        {showcaseImages[index].angle_label}
                      </figcaption>
                    )}
                  </figure>
                )}
              </React.Fragment>
            ))}

            {showcaseImages.slice(description.length).map((image, index) => (
              <figure key={image.id || `image-${index}`} className="my-7">
                <button
                  type="button"
                  onClick={() => setPreviewImage(image)}
                  className="block w-full cursor-zoom-in overflow-hidden rounded-lg bg-slate-50 p-2 dark:bg-slate-800"
                >
                  <img
                    src={image.image_url}
                    alt={image.angle_label || `${product.name} - hình ảnh bổ sung`}
                    className="mx-auto max-h-[560px] w-auto max-w-full object-contain"
                    loading="lazy"
                  />
                </button>
                {image.angle_label && (
                  <figcaption className="mt-2 text-center text-xs italic text-slate-500 dark:text-slate-400">
                    {image.angle_label}
                  </figcaption>
                )}
              </figure>
            ))}
          </article>
        )}

        {!isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90" />
        )}
      </div>

      <div className="flex justify-center border-t border-slate-100 px-4 py-4 dark:border-slate-800">
        <button
          type="button"
          onClick={handleToggleExpand}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-sky-400"
        >
          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl rounded-xl bg-white p-3 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-slate-900/80 p-2 text-white"
              aria-label="Đóng ảnh"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage.image_url}
              alt={previewImage.angle_label || product.name}
              className="max-h-[84vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductDescriptionShowcase;
