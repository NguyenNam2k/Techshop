USE `techshop_db`;

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `address`, `avatar_url`, `role`, `google_id`, `status`) VALUES
(1, 'Admin TechShop', 'admin@techshop.vn', '$2a$12$e8Yx9p8W0A.BwQ5xQ2K3XeW2K3XeW2K3XeW2K3XeW2K3XeW2K3XeW', '0901234567', 'Tòa nhà TechShop, Q.1, TP.HCM', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', 'admin', NULL, 'active'),
(2, 'Nguyễn Nam Gamer', 'nam.gamer@gmail.com', '$2a$12$e8Yx9p8W0A.BwQ5xQ2K3XeW2K3XeW2K3XeW2K3XeW2K3XeW2K3XeW', '0987654321', 'Số 45 Đường Công Nghệ, Cầu Giấy, Hà Nội', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', 'customer', 'google-oauth2-1092837465', 'active');

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon_url`, `parent_id`) VALUES
(1, 'Laptop Gaming', 'laptop-gaming', 'Laptop gaming hiệu năng cao trang bị card đồ họa RTX series', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100', NULL),
(2, 'Bàn phím cơ', 'ban-phim-co', 'Bàn phím cơ custom, hotswap, switch linear/tactile cho game thủ', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100', NULL),
(3, 'Chuột Gaming', 'chuot-gaming', 'Chuột gaming siêu nhẹ, cảm biến quang học chính xác 30K DPI', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=100', NULL),
(4, 'Phụ kiện & Linh kiện', 'phu-kien-linh-kien', 'Cáp sạc, adapter, dock chuyển đổi, tản nhiệt và phụ kiện setup', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=100', NULL);

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `brand`, `model_code`, `base_price`, `description`, `thumbnail_url`, `warranty_months`, `status`) VALUES
(1, 2, 'Bàn phím cơ TechShop Apex Pro Wireless', 'ban-phim-co-techshop-apex-pro-wireless', 'TechShop', 'TS-KB-APEXPRO', 3490000.00, 
'Bàn phím cơ không dây flagship từ TechShop với cấu trúc Gasket-mount êm ái, hỗ trợ 3 chế độ kết nối (Type-C, 2.4GHz siêu tốc 1ms và Bluetooth 5.3). Vỏ nhôm CNC nguyên khối anodized, foam cách âm Poron đa lớp, mạch xuôi Hotswap 5-pin.', 
'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800', 24, 'active'),
(2, 1, 'Laptop Gaming TechBlade CyberEdge G16', 'laptop-gaming-techblade-cyberedge-g16', 'TechShop', 'TS-LP-G16-2026', 28990000.00, 
'Cỗ máy chiến game đỉnh cao với vi xử lý Intel Core i7-14700HX kết hợp đồ họa NVIDIA GeForce RTX 40-Series. Màn hình 16 inch QHD+ 240Hz 100% DCI-P3 chuẩn màu đồ họa. Hệ thống tản nhiệt buồng hơi Vapor Chamber Liquid Metal.', 
'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', 24, 'active'),
(3, 3, 'Chuột Gaming Siêu Nhẹ TechViper V3 Pro', 'chuot-gaming-sieu-nhe-techviper-v3-pro', 'TechShop', 'TS-MS-V3PRO', 1890000.00, 
'Trọng lượng siêu nhẹ chỉ 49 gram không đục lỗ. Cảm biến quang học Focus Pro 35K Gen-2, switch quang học thế hệ 3 tuổi thọ 90 triệu lần nhấn. Polling rate nâng cấp lên 8000Hz không dây siêu mượt.', 
'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800', 12, 'active');

INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `color`, `color_code`, `spec_version`, `price`, `stock`, `image_url`, `status`) VALUES
(101, 1, 'TS-APX-BLK-RED', 'Cyber Black', '#1A1B26', 'Red Linear Switch (Gõ êm, mượt)', 3490000.00, 18, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800', 'available'),
(102, 1, 'TS-APX-BLK-BRN', 'Cyber Black', '#1A1B26', 'Brown Tactile Switch (Có khấc phản hồi)', 3490000.00, 7, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', 'available'),
(103, 1, 'TS-APX-WHT-RED', 'Frost White', '#F8FAFC', 'Red Linear Switch (Gõ êm, mượt)', 3590000.00, 3, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800', 'low_stock'),
(104, 1, 'TS-APX-WHT-BLU', 'Frost White', '#F8FAFC', 'Blue Clicky Switch (Âm thanh đanh giòn)', 3590000.00, 0, 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800', 'out_of_stock'),
(201, 2, 'TS-G16-16G-512G-4060', 'Mecha Grey', '#4B5563', 'Core i7 | RAM 16GB | SSD 512GB | RTX 4060', 28990000.00, 12, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', 'available'),
(202, 2, 'TS-G16-32G-1TB-4070', 'Mecha Grey', '#4B5563', 'Core i9 | RAM 32GB | SSD 1TB | RTX 4070', 36490000.00, 4, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800', 'low_stock'),
(301, 3, 'TS-VIPER-BLK-8K', 'Matte Black', '#111827', '8000Hz Wireless Dongle Included', 1890000.00, 25, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800', 'available'),
(302, 3, 'TS-VIPER-WHT-8K', 'Pure White', '#FFFFFF', '8000Hz Wireless Dongle Included', 1950000.00, 2, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', 'low_stock');

INSERT INTO `product_specifications` (`product_id`, `spec_group`, `spec_name`, `spec_value`, `sort_order`) VALUES
(1, 'Thông số chung', 'Thương hiệu', 'TechShop Gaming', 1),
(1, 'Thông số chung', 'Model', 'Apex Pro Wireless Tri-Mode', 2),
(1, 'Thông số chung', 'Layout phím', '75% (82 phím) + Núm xoay Multimedia kim loại', 3),
(1, 'Thông số chung', 'Chất liệu vỏ', 'Nhôm CNC 6063 Anodized nguyên khối', 4),
(1, 'Switch & Keycaps', 'Loại Switch', 'TechShop Custom Linear / Tactile (Hotswap 5-pin)', 5),
(1, 'Switch & Keycaps', 'Keycaps', 'PBT Double-shot Cherry Profile chống bóng mòn', 6),
(1, 'Switch & Keycaps', 'Cấu trúc tiêu âm', 'Gasket Mount + 5 lớp Foam Poron & IXPE switch pad', 7),
(1, 'Kết nối & Tương thích', 'Phương thức kết nối', 'USB Type-C có dây, Wireless 2.4GHz (1000Hz), Bluetooth 5.3', 8),
(1, 'Kết nối & Tương thích', 'Hệ điều hành tương thích', 'Windows 10/11, macOS, Linux, iOS, Android', 9),
(1, 'Pin & Chiếu sáng', 'Dung lượng Pin', '4.000 mAh (Lên đến 200 giờ khi tắt LED)', 10),
(1, 'Pin & Chiếu sáng', 'Đèn nền', 'RGB 16.8 triệu màu từng phím, hỗ trợ đồng bộ nhạc', 11),
(1, 'Kích thước & Trọng lượng', 'Kích thước', '325 x 135 x 40 mm', 12),
(1, 'Kích thước & Trọng lượng', 'Trọng lượng', '980 gram (Cầm cực đầm tay, chống trượt)', 13),
(1, 'Bảo hành & Phụ kiện', 'Thời gian bảo hành', '24 tháng 1 đổi 1 trong 30 ngày đầu', 14),
(1, 'Bảo hành & Phụ kiện', 'Phụ kiện kèm theo', 'Cáp Type-C bọc dù, USB Dongle 2.4G, Keycap puller, Switch puller, 3 switch sơ cua', 15),
(2, 'Bộ vi xử lý (CPU)', 'CPU', 'Intel Core i7-14700HX (20 nhân, 28 luồng, up to 5.5GHz)', 1),
(2, 'Đồ họa (GPU)', 'Card đồ họa', 'NVIDIA GeForce RTX 4060 8GB GDDR6 (TGP tối đa 140W)', 2),
(2, 'Bộ nhớ & Ổ cứng', 'RAM', '16GB DDR5 5600MHz (2 khe, nâng cấp tối đa 64GB)', 3),
(2, 'Bộ nhớ & Ổ cứng', 'Ổ cứng', '512GB M.2 PCIe Gen4 NVMe (Còn trống 1 khe M.2)', 4),
(2, 'Màn hình', 'Kích thước & Tấm nền', '16.0 inch QHD+ (2560x1600) IPS 240Hz, 100% DCI-P3, 500 nits, G-Sync', 5),
(2, 'Cổng kết nối', 'Cổng I/O', '1x Thunderbolt 4, 1x USB-C 3.2 Gen 2 (PD 100W), 2x USB-A 3.2, 1x HDMI 2.1, RJ-45 LAN, Jack 3.5mm', 6),
(2, 'Pin & Nguồn', 'Dung lượng pin', '90Wh Li-ion polymer, Sạc nhanh 280W', 7),
(2, 'Trọng lượng', 'Trọng lượng máy', '2.3 kg', 8);

INSERT INTO `product_images` (`id`, `product_id`, `variant_id`, `image_url`, `public_id`, `angle_label`, `is_primary`, `sort_order`) VALUES
(1, 1, 101, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000', 'techshop/kb_apex_front', 'Mặt trước tổng thể (Perspective View)', TRUE, 1),
(2, 1, 101, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000', 'techshop/kb_apex_switch', 'Cận cảnh cụm Switch Hotswap & Keycap PBT', FALSE, 2),
(3, 1, 101, 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1000', 'techshop/kb_apex_angle', 'Góc nhìn nghiêng công thái học 45°', FALSE, 3),
(4, 1, 101, 'https://images.unsplash.com/photo-1541140532154-b024d705b909?w=1000', 'techshop/kb_apex_ports', 'Chi tiết Cổng I/O Type-C & Cần gạt chế độ kết nối', FALSE, 4),
(5, 1, 101, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=1000', 'techshop/kb_apex_bottom', 'Mặt đáy nhôm khắc logo CNC & Chân đế 2 nấc cao su', FALSE, 5),
(6, 2, 201, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1000', 'techshop/lp_g16_front', 'Góc mở nắp chính diện màn hình viền mỏng', TRUE, 1),
(7, 2, 201, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000', 'techshop/lp_g16_ports', 'Hệ thống cổng kết nối I/O cạnh trái & cạnh phải', FALSE, 2),
(8, 3, 301, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1000', 'techshop/ms_v3_top', 'Góc nhìn từ trên xuống (Top View dáng cầm đối xứng)', TRUE, 1),
(9, 3, 301, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1000', 'techshop/ms_v3_front', 'Cổng sạc Type-C mặt trước & Con lăn bọc cao su', FALSE, 2);

INSERT INTO `product_embeddings` (`id`, `product_id`, `image_id`, `embedding_type`, `vector`, `model_name`) VALUES
(1, 1, 1, 'image', '[0.0142, -0.0521, 0.0891, 0.1245, -0.0034, 0.0712, -0.0432, 0.0198]', 'clip-ViT-B-32-multilingual-v1'),
(2, 2, 6, 'image', '[0.0821, 0.0125, -0.0451, 0.0912, 0.1432, -0.0211, 0.0654, -0.0387]', 'clip-ViT-B-32-multilingual-v1'),
(3, 3, 8, 'image', '[-0.0312, 0.0945, 0.0218, -0.0512, 0.0187, 0.1102, -0.0651, 0.0429]', 'clip-ViT-B-32-multilingual-v1');

INSERT INTO `cart_items` (`user_id`, `variant_id`, `quantity`) VALUES
(2, 101, 1),
(2, 301, 1);

INSERT INTO `orders` (`id`, `order_code`, `user_id`, `customer_name`, `customer_phone`, `shipping_address`, `payment_method`, `payment_status`, `shipping_status`, `total_amount`, `shipping_fee`, `final_amount`, `order_notes`) VALUES
(1, 'TS-2026-8941', 2, 'Nguyễn Nam Gamer', '0987654321', 'Số 45 Đường Công Nghệ, Cầu Giấy, Hà Nội', 'cod', 'unpaid', 'shipping', 3490000.00, 30000.00, 3520000.00, 'Giao giờ hành chính');

INSERT INTO `order_items` (`order_id`, `variant_id`, `product_name`, `variant_name`, `sku`, `unit_price`, `quantity`, `subtotal`) VALUES
(1, 101, 'Bàn phím cơ TechShop Apex Pro Wireless', 'Cyber Black / Red Linear Switch', 'TS-APX-BLK-RED', 3490000.00, 1, 3490000.00);

INSERT INTO `inventory_logs` (`variant_id`, `user_id`, `order_id`, `change_type`, `quantity_changed`, `stock_after`, `note`) VALUES
(101, 1, NULL, 'import', 20, 20, 'Nhập lô hàng đầu tiên từ xưởng'),
(101, NULL, 1, 'order_deduct', -1, 19, 'Tự động trừ kho khi đơn TS-2026-8941 tạo thành công');
