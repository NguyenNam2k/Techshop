import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Thư viện các góc chụp thực tế & infographic bổ trợ theo từng nhóm sản phẩm
const CATEGORY_ANGLE_FALLBACKS = {
  laptops: [
    {
      angle_label: 'Màn hình OLED viền mỏng & Tần số quét cao',
      image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Bàn phím LED RGB & Cụm Touchpad phủ kính',
      image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt sau & Khe tản nhiệt Arc Flow 3 quạt',
      image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Sơ đồ cổng kết nối 2 bên (Thunderbolt 4, HDMI 2.1)',
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Góc nghiêng 45° tôn vinh độ mỏng nhôm CNC',
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Trọn bộ sạc nhanh GaN & Hộp Fullbox phụ kiện',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=85'
    }
  ],
  gpus: [
    {
      angle_label: 'Mặt trước hệ thống quạt Axial-tech làm mát',
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt lưng Backplate nhôm phay xước bảo vệ PCB',
      image_url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Cổng xuất hình chuẩn HDMI 2.1a / DisplayPort 1.4a',
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Đầu cấp nguồn 16-pin 12VHPWR & Buồng hơi Vapor Chamber',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Đèn LED ARGB đồng bộ Aura Sync rực rỡ',
      image_url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Trọn bộ hộp chính hãng kèm thanh đỡ chống xệ VGA',
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1000&auto=format&fit=crop&q=85'
    }
  ],
  monitors: [
    {
      angle_label: 'Trực diện màn hình viền siêu mỏng 3 cạnh sắc nét',
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt sau tích hợp đèn Ambient Light & Khe tản nhiệt',
      image_url: 'https://images.unsplash.com/photo-1547119957-637f8679db1e?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Chân đế công thái học Ergo nâng hạ, xoay dọc 90°',
      image_url: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Cụm cổng kết nối đa năng (Type-C PD, HDMI 2.1, DP)',
      image_url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Góc nhìn siêu rộng 178° không biến dạng màu sắc',
      image_url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Phụ kiện cáp kết nối bọc dù & Hộp xốp chống sốc',
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=85'
    }
  ],
  keyboards: [
    {
      angle_label: 'Toàn cảnh layout phím cơ custom công thái học',
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Cận cảnh cụm Switch cơ học Hot-swap tháo rời',
      image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Màn hình OLED đa thông số & Núm xoay kim loại',
      image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Đèn LED RGB từng phím lung linh trong bóng tối',
      image_url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt đáy đệm cao su giảm chấn, chân nâng góc nghiêng',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Dây cáp Type-C bện dù, Dụng cụ gắp switch & Nắp mica',
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=85'
    }
  ],
  motherboards: [
    {
      angle_label: 'Góc nhìn tổng thể bo mạch ATX cao cấp',
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Cụm tản nhiệt phase nguồn VRM hợp kim nhôm khối',
      image_url: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Sơ đồ I/O mặt sau bọc sẵn & Anten Wi-Fi 7 thế hệ mới',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Khe PCIe 5.0 bọc thép SafeSlot & 5x Khay tản M.2 NVMe',
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt lưng PCB sợi thủy tinh gia cường lực',
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Trọn bộ phụ kiện cáp SATA, card mở rộng & Hộp Box',
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1000&auto=format&fit=crop&q=85'
    }
  ],
  cpus: [
    {
      angle_label: 'Vỏ hộp Box chính hãng nguyên seal tem phân phối',
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt trước IHS mạ niken khắc laser sắc nét',
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Chân tiếp xúc Socket mạ vàng nano cao cấp',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Khay bảo vệ chống cong vênh & Giấy chứng nhận xuất xưởng',
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=85'
    }
  ],
  mice: [
    {
      angle_label: 'Góc nghiêng công thái học êm ái',
      image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt đáy cảm biến quang học & Feet PTFE siêu trơn',
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Trọn bộ phụ kiện cáp sạc bọc dù & Đầu thu không dây',
      image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=85'
    }
  ],
  default: [
    {
      angle_label: 'Góc nghiêng 45° hoàn thiện cao cấp',
      image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Mặt sau & Cổng giao tiếp tiêu chuẩn',
      image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=85'
    },
    {
      angle_label: 'Đóng gói Fullbox phụ kiện chính hãng',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=85'
    }
  ]
};

const ProductGallery = ({ product, selectedVariant }) => {
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const thumbnailScrollRef = useRef(null);

  // Phân loại: Nhận diện sản phẩm chuyên sâu/cao cấp cần nhiều thông tin trực quan (Nhồi 5-6 ảnh chi tiết)
  // Các sản phẩm đơn giản giữ 2-3 ảnh cơ bản, không nhồi thừa
  const isHighInfoProduct = useMemo(() => {
    if (!product) return false;
    const cat = (product.category_slug || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const price = Number(product.base_price || product.price || 0);

    // 1. Nhóm thiết bị phần cứng & gear phức tạp
    const highInfoCategories = [
      'laptop',
      'laptops',
      'gpu',
      'gpus',
      'vga',
      'card-man-hinh',
      'monitor',
      'monitors',
      'man-hinh',
      'keyboard',
      'keyboards',
      'ban-phim',
      'motherboard',
      'motherboards',
      'mainboard',
      'bo-mach-chu'
    ];

    if (highInfoCategories.some((k) => cat.includes(k))) return true;

    // 2. Sản phẩm cao cấp, Flagship hoặc có giá trị từ 15 triệu
    if (price >= 15000000) return true;
    if (
      /zephyrus|strix|legion|nitro|oled|4090|4080|titanium|dark hero|formula|superlight|custom/i.test(
        name
      )
    ) {
      return true;
    }

    return false;
  }, [product]);

  // Số lượng ảnh mục tiêu: 6 ảnh cho sản phẩm cần nhiều info; 3 ảnh cho phụ kiện/sản phẩm thông thường
  const targetMaxImages = isHighInfoProduct ? 6 : 3;

  // 1. Tự động gom góp toàn bộ ảnh từ DB (Thumbnail + product_images + variants + bổ sung góc chụp)
  const imagesToShow = useMemo(() => {
    const list = [];
    const seenUrls = new Set();

    // A. Ảnh bìa chính
    if (product?.thumbnail_url) {
      list.push({
        id: 'primary-thumb',
        image_url: product.thumbnail_url,
        angle_label: 'Chính diện (Ảnh bìa)'
      });
      seenUrls.add(product.thumbnail_url);
    }

    // B. Ảnh từ bảng product_images
    if (Array.isArray(product?.images)) {
      for (const img of product.images) {
        if (img?.image_url && !seenUrls.has(img.image_url)) {
          list.push({
            id: img.id || `img-${list.length}`,
            image_url: img.image_url,
            angle_label: img.angle_label || `Góc chụp ${list.length + 1}`
          });
          seenUrls.add(img.image_url);
        }
      }
    }

    // C. Ảnh các biến thể màu sắc khác nhau
    if (Array.isArray(product?.variants)) {
      for (const v of product.variants) {
        if (v?.image_url && !seenUrls.has(v.image_url)) {
          list.push({
            id: `var-${v.id}`,
            image_url: v.image_url,
            angle_label: v.color ? `Bản màu: ${v.color}` : 'Biến thể'
          });
          seenUrls.add(v.image_url);
        }
      }
    }

    // D. Bổ sung góc chụp giàu thông tin theo danh mục nếu số lượng chưa đạt mục tiêu (5-6 ảnh cho high-info)
    if (list.length < targetMaxImages) {
      const catKey = product?.category_slug || 'default';
      const fallbacks =
        CATEGORY_ANGLE_FALLBACKS[catKey] ||
        CATEGORY_ANGLE_FALLBACKS[catKey.replace(/s$/, '')] ||
        CATEGORY_ANGLE_FALLBACKS.default;

      for (const fb of fallbacks) {
        if (list.length >= targetMaxImages) break;
        if (!seenUrls.has(fb.image_url)) {
          list.push({
            id: `fb-${list.length}`,
            image_url: fb.image_url,
            angle_label: fb.angle_label
          });
          seenUrls.add(fb.image_url);
        }
      }
    }

    // E. Trường hợp rỗng dự phòng tối thượng
    if (list.length === 0) {
      list.push({
        id: 'fallback-0',
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        angle_label: 'Chính diện'
      });
    }

    return list;
  }, [product, targetMaxImages]);

  // Reset về ảnh đầu khi đổi sản phẩm
  useEffect(() => {
    setMainImageIndex(0);
  }, [product?.id]);

  // Khi chọn biến thể có ảnh riêng, chuyển ngay tới ảnh đó
  useEffect(() => {
    if (selectedVariant?.image_url) {
      const idx = imagesToShow.findIndex((img) => img.image_url === selectedVariant.image_url);
      if (idx !== -1) {
        setMainImageIndex(idx);
        scrollThumbnailIntoView(idx);
      }
    }
  }, [selectedVariant?.id, selectedVariant?.image_url, imagesToShow]);

  // Cuộn thanh thumbnail ngang tự động
  const scrollThumbnailIntoView = (index) => {
    if (!thumbnailScrollRef.current) return;
    const container = thumbnailScrollRef.current;
    const items = container.querySelectorAll('.pdp-thumb-item');
    if (items[index]) {
      items[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  const handleSelectImage = (index) => {
    setMainImageIndex(index);
    scrollThumbnailIntoView(index);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    const nextIdx = mainImageIndex === 0 ? imagesToShow.length - 1 : mainImageIndex - 1;
    handleSelectImage(nextIdx);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    const nextIdx = mainImageIndex === imagesToShow.length - 1 ? 0 : mainImageIndex + 1;
    handleSelectImage(nextIdx);
  };

  const scrollThumbTrack = (offset) => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Hỗ trợ cảm ứng vuốt trên điện thoại
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
  };

  // Phím mũi tên trái/phải
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape' && isLightboxOpen) setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainImageIndex, imagesToShow.length, isLightboxOpen]);

  const currentImage = imagesToShow[mainImageIndex] || imagesToShow[0];

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. KHUNG ẢNH CHÍNH (SLIDER CAROUSEL MƯỢT MÀ)                                */}
      {/* Lưu ý z-index được giới hạn ở z-10 để tuyệt đối không bị lòi qua Header     */}
      {/* ========================================================================= */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="group relative w-full h-80 sm:h-96 md:h-[460px] rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden select-none flex items-center justify-center shadow-lg"
      >
        {/* Track trượt ảnh ngang */}
        <div
          className="flex transition-transform duration-500 ease-out h-full w-full"
          style={{ transform: `translateX(-${mainImageIndex * 100}%)` }}
        >
          {imagesToShow.map((image, index) => (
            <div
              key={`${image.id || image.image_url}-${index}`}
              className="w-full h-full flex-shrink-0 flex items-center justify-center p-4 md:p-8 cursor-zoom-in"
              onClick={() => {
                setLightboxScale(1);
                setIsLightboxOpen(true);
              }}
              title="Nhấp để phóng to toàn màn hình"
            >
              <img
                src={image.image_url}
                alt={`${product?.name} - ${image.angle_label}`}
                className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Nút Phóng To Toàn Màn Hình (z-10 để không bị lòi khi cuộn) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxScale(1);
            setIsLightboxOpen(true);
          }}
          aria-label="Phóng to ảnh"
          className="absolute top-3.5 left-3.5 z-10 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white transition shadow-sm opacity-80 group-hover:opacity-100 cursor-pointer"
          title="Xem ảnh phóng to"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Nhãn góc chụp (Bottom Left, z-10) */}
        {currentImage?.angle_label && (
          <div className="absolute bottom-3.5 left-3.5 z-10 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-200 pointer-events-none shadow-sm flex items-center gap-1.5 max-w-[70%] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
            <span className="truncate">{currentImage.angle_label}</span>
          </div>
        )}

        {/* Bộ đếm chỉ số ảnh (Top Right, z-10) */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-full text-xs font-mono font-bold text-slate-200 shadow-sm pointer-events-none">
          <span>
            {mainImageIndex + 1} / {imagesToShow.length}
          </span>
        </div>

        {/* Nút Prev / Next mũi tên (z-10 để không bao giờ đè lên Header khi scroll) */}
        {imagesToShow.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-900/90 hover:bg-sky-600 text-slate-200 hover:text-white border border-slate-700/80 shadow-xl transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh kế tiếp"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-slate-900/90 hover:bg-sky-600 text-slate-200 hover:text-white border border-slate-700/80 shadow-xl transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dấu chấm chỉ báo trang ảnh (z-10) */}
        {imagesToShow.length > 1 && (
          <div className="absolute bottom-3.5 right-3.5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/80 shadow-sm">
            {imagesToShow.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectImage(idx);
                }}
                aria-label={`Đi tới ảnh ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === mainImageIndex
                    ? 'w-5 bg-sky-400 shadow-sm'
                    : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH SLIDER THUMBNAILS NGANG VỚI NÚT CUỘN TRÁI / PHẢI                 */}
      {/* ========================================================================= */}
      {imagesToShow.length > 1 && (
        <div className="relative group/thumbs flex items-center">
          {/* Nút cuộn thumbnail sang trái */}
          <button
            type="button"
            onClick={() => scrollThumbTrack(-160)}
            className="hidden sm:flex absolute left-0 z-10 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 shadow-md -translate-x-2 transition cursor-pointer"
            aria-label="Cuộn thumbnail sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dải thumbnail cuộn ngang mượt mà */}
          <div
            ref={thumbnailScrollRef}
            className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 w-full scroll-smooth scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {imagesToShow.map((image, index) => {
              const isActive = index === mainImageIndex;
              return (
                <button
                  key={`${image.id || image.image_url}-${index}`}
                  type="button"
                  onClick={() => handleSelectImage(index)}
                  onMouseEnter={() => handleSelectImage(index)}
                  className={`pdp-thumb-item group relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 overflow-hidden bg-slate-900 p-1.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-sky-500 ring-2 ring-sky-500/30 scale-105 shadow-md bg-slate-800'
                      : 'border-slate-800 hover:border-sky-400/60 opacity-75 hover:opacity-100 shadow-sm'
                  }`}
                  title={image.angle_label}
                >
                  <img
                    src={image.image_url}
                    alt={`${product?.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                    loading="lazy"
                  />
                  {/* Tooltip góc chụp khi hover */}
                  {image.angle_label && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 border border-slate-700 text-[10px] font-semibold text-white rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-20">
                      {image.angle_label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Nút cuộn thumbnail sang phải */}
          <button
            type="button"
            onClick={() => scrollThumbTrack(160)}
            className="hidden sm:flex absolute right-0 z-10 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 shadow-md translate-x-2 transition cursor-pointer"
            aria-label="Cuộn thumbnail sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CAM KẾT TIÊU CHUẨN DỊCH VỤ                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate">100% Chính Hãng</div>
            <div className="text-[11px] text-slate-400 font-medium truncate">Nguyên seal NSX</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate">Giao Hỏa Tốc 2H</div>
            <div className="text-[11px] text-slate-400 font-medium truncate">Nội thành an toàn</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate">Đổi Mới 30 Ngày</div>
            <div className="text-[11px] text-slate-400 font-medium truncate">1 đổi 1 do lỗi NSX</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL PHÓNG TO TOÀN MÀN HÌNH (LIGHTBOX)                              */}
      {/* ========================================================================= */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 animate-in fade-in duration-200 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar Controls */}
          <div
            className="w-full flex items-center justify-between max-w-6xl py-2 px-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-sky-400">Ảnh {mainImageIndex + 1}/{imagesToShow.length}:</span>
              <span className="text-slate-300 font-normal">{currentImage?.angle_label}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxScale((prev) => Math.min(prev + 0.25, 2.5))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxScale((prev) => Math.max(prev - 0.25, 0.75))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition cursor-pointer ml-2"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Vùng ảnh chính Lightbox */}
          <div
            className="flex-1 w-full max-w-5xl flex items-center justify-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage?.image_url}
              alt={product?.name}
              className="max-h-[75vh] max-w-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${lightboxScale})` }}
            />

            {/* Mũi tên qua lại trong Lightbox */}
            {imagesToShow.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white border border-slate-700 shadow-2xl transition cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white border border-slate-700 shadow-2xl transition cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip dưới chân Lightbox */}
          {imagesToShow.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto py-2 max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {imagesToShow.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectImage(idx)}
                  className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-slate-900 p-1 shrink-0 transition-all cursor-pointer ${
                    idx === mainImageIndex
                      ? 'border-sky-500 ring-2 ring-sky-500/30 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
