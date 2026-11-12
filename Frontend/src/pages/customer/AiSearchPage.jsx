
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Search,
    UploadCloud,
    Layers,
    X,
    Loader2,
    ArrowRight,
    Sliders,
    Image as ImageIcon,
    CheckCircle2,
    AlertCircle,
    Home,
    ChevronRight,
    Cpu,
    Zap,
    TrendingUp
} from 'lucide-react';
import { aiSearchService } from '../../services/aiSearchService';

const formatVND = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const SUGGESTED_PROMPTS = [
    'Laptop đồ họa mỏng nhẹ hiệu năng cao',
    'Chuột gaming không dây siêu nhẹ',
    'Bàn phím cơ custom gõ êm',
    'Card màn hình ASUS ROG RTX 4070 Ti',
    'Màn hình gaming OLED 240Hz'
];

export default function AiSearchPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const hybridFileInputRef = useRef(null);

    // Quản lý chế độ tìm kiếm
    const [activeTab, setActiveTab] = useState('semantic'); // 'semantic' | 'visual' | 'hybrid'

    // State Visual
    const [visualFile, setVisualFile] = useState(null);
    const [visualPreview, setVisualPreview] = useState(null);

    // State Semantic
    const [semanticQuery, setSemanticQuery] = useState('');

    // State Hybrid
    const [hybridFile, setHybridFile] = useState(null);
    const [hybridPreview, setHybridPreview] = useState(null);
    const [hybridText, setHybridText] = useState('');
    const [alpha, setAlpha] = useState(0.5);

    // Top 10 Results
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchStats, setSearchStats] = useState(null);

    // Chọn ảnh Visual Search
    const handleSelectVisualImage = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setErrorMsg('Vui lòng chọn đúng tệp hình ảnh (JPG, PNG, WEBP)!');
            return;
        }
        setErrorMsg('');
        setVisualFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setVisualPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    // Chọn ảnh Hybrid Search
    const handleSelectHybridImage = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setErrorMsg('Vui lòng chọn đúng tệp hình ảnh (JPG, PNG, WEBP)!');
            return;
        }
        setErrorMsg('');
        setHybridFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setHybridPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    // Thực hiện tìm kiếm
    const handleSearch = async (e) => {
        e?.preventDefault();
        setErrorMsg('');
        setLoading(true);
        setSearched(true);
        setResults([]);

        const startTime = performance.now();

        try {
            let data;
            if (activeTab === 'semantic') {
                if (!semanticQuery.trim()) {
                    setErrorMsg('Vui lòng nhập nội dung mô tả sản phẩm cần tìm kiếm!');
                    setLoading(false);
                    return;
                }
                data = await aiSearchService.searchSemantic(semanticQuery, 10);
            } else if (activeTab === 'visual') {
                if (!visualFile) {
                    setErrorMsg('Vui lòng tải lên hoặc kéo thả ảnh thiết bị cần tìm!');
                    setLoading(false);
                    return;
                }
                data = await aiSearchService.searchImage(visualFile, 10);
            } else if (activeTab === 'hybrid') {
                if (!hybridFile) {
                    setErrorMsg('Vui lòng tải lên ảnh sản phẩm cần đối chiếu!');
                    setLoading(false);
                    return;
                }
                if (!hybridText.trim()) {
                    setErrorMsg('Vui lòng nhập mô tả văn bản bổ sung!');
                    setLoading(false);
                    return;
                }
                if (alpha <= 0 || alpha >= 1) {
                    setErrorMsg('Trọng số Hybrid phải thỏa mãn điều kiện 0 < alpha < 1 để bảo đảm kết hợp cả hình ảnh và mô tả chữ!');
                    setLoading(false);
                    return;
                }
                data = await aiSearchService.searchHybrid(hybridFile, hybridText, alpha, 10);
            }

            const elapsed = (performance.now() - startTime).toFixed(0);
            setSearchStats({
                time: elapsed,
                count: data?.results?.length || 0
            });
            setResults(data?.results || []);
        } catch (err) {
            setErrorMsg(err.message || 'Không thể kết nối tới máy chủ AI Search (Port 8000). Vui lòng đảm bảo dịch vụ AI đang chạy.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Top Navigation & Breadcrumb */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Link to="/" className="hover:text-cyan-400 transition flex items-center gap-1.5 font-medium">
                            <Home className="w-4 h-4 text-cyan-400" />
                            <span>Trang chủ</span>
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        <Link to="/catalog" className="hover:text-cyan-400 transition">
                            <span>Sản phẩm</span>
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-cyan-400 font-semibold">AI Search Hub</span>
                    </div>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition shadow-sm"
                    >
                        <span>&larr; Quay lại cửa hàng</span>
                    </Link>
                </div>

                {/* ========================================================= */}
                {/* AI SEARCH HUB - 3 CHẾ ĐỘ TÌM KIẾM     */}
                {/* ========================================================= */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/50 border border-slate-800 p-6 md:p-10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            <span>TECHSHOP MULTI-MODAL AI SEARCH ENGINE</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Trung Tâm Tìm Kiếm Thông Minh <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI Search Hub</span>
                        </h1>

                        <p className="text-sm text-slate-300 leading-relaxed">
                            Ứng dụng mô hình không gian nhúng đa chiều <strong>CLIP ViT-B-32</strong> kết hợp <strong>Mean Centering</strong> và thuật toán tối ưu tích vô hướng NumPy Dot Product dưới 100ms.
                        </p>
                    </div>

                    {/* 3 THẺ CHỌN PHƯƠNG THỨC TÌM KIẾM */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        {/* Chế độ 1: Semantic */}
                        <div
                            onClick={() => {
                                setActiveTab('semantic');
                                setSearched(false);
                            }}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${activeTab === 'semantic'
                                ? 'bg-cyan-500/15 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                                <Search className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">1. Semantic Search</h3>
                            <p className="text-xs text-slate-400">
                                Tìm theo ngôn ngữ tự nhiên tiếng Việt, tự động chuẩn hóa văn bản &amp; Mean Centering.
                            </p>
                        </div>

                        {/* Chế độ 2: Visual */}
                        <div
                            onClick={() => {
                                setActiveTab('visual');
                                setSearched(false);
                            }}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${activeTab === 'visual'
                                ? 'bg-purple-500/15 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">2. Visual Search</h3>
                            <p className="text-xs text-slate-400">
                                Tải ảnh chụp phụ kiện/thiết bị từ máy tính, trích xuất đặc trưng Vision CLIP 512D.
                            </p>
                        </div>

                        {/* Chế độ 3: Hybrid */}
                        <div
                            onClick={() => {
                                setActiveTab('hybrid');
                                setSearched(false);
                            }}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${activeTab === 'hybrid'
                                ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">3. Hybrid Search</h3>
                            <p className="text-xs text-slate-400">
                                Kết hợp cả Ảnh + Mô tả văn bản, điều chỉnh trọng số dung hợp vector linh hoạt.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* KHUNG PHƯƠNG THỨC ĐƯỢC CHỌN */}
                {/* ========================================================= */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    {/* MÀN HÌNH 3: SEMANTIC SEARCH */}
                    {activeTab === 'semantic' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                                <Search className="w-4 h-4" />
                                <span>Nhập mô tả sản phẩm bằng tiếng Việt</span>
                            </div>

                            <form onSubmit={handleSearch} className="relative flex items-center">
                                <Search className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={semanticQuery}
                                    onChange={(e) => setSemanticQuery(e.target.value)}
                                    placeholder="Ví dụ: 'laptop gaming đồ họa mỏng nhẹ', 'chuột không dây nhỏ gọn cho nữ'..."
                                    className="w-full pl-12 pr-32 py-4 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-400 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !semanticQuery.trim()}
                                    className="absolute right-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Tìm kiếm</span>}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>

                            {/* Gợi ý thông minh */}
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                                <span className="text-xs text-slate-400 font-medium">Gợi ý từ khóa mẫu:</span>
                                {SUGGESTED_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => setSemanticQuery(prompt)}
                                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition cursor-pointer"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VISUAL SEARCH */}
                    {activeTab === 'visual' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
                                <ImageIcon className="w-4 h-4" />
                                <span>Tải ảnh phụ kiện hoặc thiết bị cần đối soát</span>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleSelectVisualImage(e.target.files?.[0])}
                            />

                            {!visualPreview ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-700 hover:border-purple-400/80 bg-slate-950/60 hover:bg-purple-950/10 rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                                        <UploadCloud className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">
                                            Bấm để chọn ảnh từ máy tính hoặc kéo thả tệp vào đây
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Hỗ trợ JPG, PNG, WEBP (Mô hình tự động chuẩn hóa kích thước 224x224 RGB)
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                    <img
                                        src={visualPreview}
                                        alt="Preview"
                                        className="w-24 h-24 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1"
                                    />
                                    <div className="flex-1 min-w-0 text-center sm:text-left">
                                        <p className="text-sm font-bold text-white truncate">{visualFile?.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Dung lượng: {(visualFile?.size / 1024).toFixed(1)} KB • Trạng thái: Sẵn sàng trích xuất vector CLIP
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVisualFile(null);
                                                setVisualPreview(null);
                                            }}
                                            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                                        >
                                            Chọn ảnh khác
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSearch}
                                            disabled={loading}
                                            className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            <span>Đối soát hình ảnh</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* HYBRID SEARCH */}
                    {activeTab === 'hybrid' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                                <Layers className="w-4 h-4" />
                                <span>Tìm kiếm kết hợp đa phương thức (Ảnh + Mô tả văn bản)</span>
                            </div>

                            <input
                                ref={hybridFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleSelectHybridImage(e.target.files?.[0])}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* 1. Tải ảnh */}
                                <div>
                                    {!hybridPreview ? (
                                        <div
                                            onClick={() => hybridFileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 h-full min-h-[120px]"
                                        >
                                            <ImageIcon className="w-6 h-6 text-amber-400" />
                                            <span className="text-xs font-bold text-slate-200">1. Tải ảnh sản phẩm đối chiếu</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                                            <img
                                                src={hybridPreview}
                                                alt="Preview"
                                                className="w-16 h-16 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{hybridFile?.name}</p>
                                                <span className="text-[10px] text-amber-400 font-semibold">✓ Ảnh đã sẵn sàng</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHybridFile(null);
                                                    setHybridPreview(null);
                                                }}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Nhập văn bản */}
                                <div className="flex flex-col justify-center">
                                    <label className="text-xs text-slate-400 font-semibold mb-1.5">
                                        2. Nhập mô tả tinh chỉnh bổ sung:
                                    </label>
                                    <input
                                        type="text"
                                        value={hybridText}
                                        onChange={(e) => setHybridText(e.target.value)}
                                        placeholder="Ví dụ: 'màu trắng tinh tế', 'phiên bản năm 2024'..."
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                </div>
                            </div>

                            {/* Thanh trượt Alpha */}
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                                    <Sliders className="w-4 h-4 text-amber-400" />
                                    <span>Trọng số dung hợp (0 &lt; &alpha; &lt; 1):</span>
                                </div>

                                <div className="flex-1 w-full flex items-center gap-4">
                                    <span className="text-xs text-slate-400 font-mono">Chữ ({((1 - alpha) * 100).toFixed(0)}%)</span>
                                    <input
                                        type="range"
                                        min="0.05"
                                        max="0.95"
                                        step="0.05"
                                        value={alpha}
                                        onChange={(e) => setAlpha(parseFloat(e.target.value))}
                                        className="flex-1 accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                                        title="Trọng số alpha phải nằm trong khoảng (0, 1) để kết hợp cả Chữ và Ảnh"
                                    />
                                    <span className="text-xs text-slate-400 font-mono">Ảnh ({(alpha * 100).toFixed(0)}%)</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span>Tìm kiếm Hybrid</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lỗi nếu có */}
                    {errorMsg && (
                        <div className="mt-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                </div>

                {/* ========================================================= */}
                {/* LƯỚI TOP 10 KẾT QUẢ SẢN PHẨM*/}
                {/* ========================================================= */}
                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900 border border-slate-800 rounded-3xl">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                            <Cpu className="w-7 h-7 text-cyan-400 animate-spin" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">AI Engine đang xử lý phép nhân ma trận 512D...</p>
                            <p className="text-xs text-slate-500 mt-1">Đang tính toán Cosine Similarity trên toàn bộ vector sản phẩm</p>
                        </div>
                    </div>
                )}

                {!loading && searched && (
                    <div className="space-y-4">
                        {/* Header thống kê kết quả */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-extrabold text-white">Top 10 Sản Phẩm Tương Đồng Nhất</h2>
                                {searchStats && (
                                    <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                                        ⚡ {searchStats.time} ms • {searchStats.count} kết quả
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-cyan-400 font-semibold">Sắp xếp theo độ tương đồng giảm dần</span>
                        </div>

                        {results.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-3xl">
                                Không tìm thấy sản phẩm nào đạt độ tương đồng yêu cầu.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                {results.map((product, idx) => {
                                    const similarity = product.similarity || 0;
                                    const isHighMatch = similarity >= 0.25;

                                    return (
                                        <div
                                            key={product.id || idx}
                                            onClick={() => navigate(`/products/${product.slug || product.id}`)}
                                            className="group bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 cursor-pointer relative"
                                        >
                                            {/* Badge Điểm tương đồng % */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-bold">
                                                    #{idx + 1}
                                                </span>
                                                <span
                                                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${isHighMatch
                                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                                        }`}
                                                >
                                                    {product.similarity_percent || `${(similarity * 100).toFixed(1)}%`}
                                                </span>
                                            </div>

                                            {/* Ảnh sản phẩm */}
                                            <div className="w-full h-36 bg-slate-950 rounded-xl p-2 flex items-center justify-center mb-3 border border-slate-800/60 overflow-hidden">
                                                <img
                                                    src={
                                                        product.thumbnail_url ||
                                                        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300'
                                                    }
                                                    alt={product.name}
                                                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                                                />
                                            </div>

                                            {/* Thông tin */}
                                            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {product.brand || 'Thiết bị'}
                                                    </span>
                                                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 line-clamp-2 transition-colors">
                                                        {product.name}
                                                    </h4>
                                                </div>

                                                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                                                    <span className="text-xs font-mono font-extrabold text-amber-400">
                                                        {formatVND(product.base_price || product.min_price)}
                                                    </span>
                                                    <span className="text-[11px] text-cyan-400 font-semibold group-hover:translate-x-0.5 transition">
                                                        Chi tiết →
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}