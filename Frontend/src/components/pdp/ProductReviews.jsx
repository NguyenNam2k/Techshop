import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Send,
  AlertCircle,
  Sparkles,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STAR_LABELS = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng - Đỉnh cao'
};

const ProductReviews = ({ productId, productName = 'sản phẩm' }) => {
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    total_reviews: 0,
    average_rating: 5.0,
    star_counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState(null);

  // Review Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [likedReviews, setLikedReviews] = useState({});

  // Prefill customer name if logged in
  useEffect(() => {
    if (user?.name || user?.full_name) {
      setCustomerName(user.name || user.full_name);
    }
  }, [user]);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const data = await api.getProductReviews(productId, {
        rating: selectedRatingFilter
      });
      if (data) {
        setReviews(data.reviews || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, selectedRatingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 5) {
      setFormError('Vui lòng nhập ít nhất 5 ký tự để nhận xét có ý nghĩa.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await api.createProductReview(productId, {
        rating,
        comment: trimmedComment,
        customer_name: customerName.trim() || (user?.name || 'Khách hàng TechShop')
      });

      setFormSuccess('Đánh giá của bạn đã được ghi nhận thành công! Cảm ơn bạn.');
      setComment('');
      setShowForm(false);

      // Prepend to list
      setReviews((prev) => [created, ...prev]);
      // Update summary counts
      setSummary((prev) => {
        const newTotal = (prev.total_reviews || 0) + 1;
        const starCounts = { ...prev.star_counts };
        starCounts[rating] = (starCounts[rating] || 0) + 1;
        return {
          ...prev,
          total_reviews: newTotal,
          star_counts: starCounts
        };
      });

      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setFormError(err.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (reviewId) => {
    if (likedReviews[reviewId]) return;
    try {
      setLikedReviews((prev) => ({ ...prev, [reviewId]: true }));
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, likes: (r.likes || 0) + 1 } : r))
      );
      await api.likeProductReview(productId, reviewId);
    } catch (err) {
      console.error('Error liking review:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const totalReviews = summary.total_reviews || 0;
  const avgRating = summary.average_rating || 5.0;

  return (
    <section className="pt-10 border-t border-slate-800 space-y-8" id="product-reviews">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-extrabold text-slate-100">
              Đánh Giá &amp; Nhận Xét Của Khách Hàng
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tổng hợp trải nghiệm thực tế từ những khách hàng đã mua và sử dụng {productName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/20 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{showForm ? 'Đóng khung đánh giá' : 'Viết đánh giá của bạn'}</span>
        </button>
      </div>

      {/* Thông báo thành công */}
      {formSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Form Viết Đánh Giá Mới */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="p-6 rounded-3xl bg-slate-900 border border-sky-500/30 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Gửi Đánh Giá Trải Nghiệm Của Bạn
            </h3>
            <span className="text-[11px] text-slate-400">
              {user ? `Đăng bởi: ${user.name || user.email}` : 'Khách vãng lai'}
            </span>
          </div>

          {/* Chọn số sao */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              1. Bạn chấm sản phẩm này mấy sao?
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700 hover:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-extrabold text-amber-400 ml-2">
                {STAR_LABELS[hoverRating || rating]}
              </span>
            </div>
          </div>

          {/* Tên khách hàng nếu chưa đăng nhập */}
          {!user && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                2. Họ và tên hiển thị:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* Nội dung nhận xét */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              {user ? '2' : '3'}. Cảm nhận chi tiết về sản phẩm:
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ về độ hoàn thiện, hiệu năng chơi game / làm việc, nhiệt độ, đóng gói và dịch vụ bảo hành..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Tối thiểu 5 ký tự</span>
              <span>{comment.length} ký tự</span>
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Đang gửi...' : 'Gửi nhận xét'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Bảng Thống Kê Tổng Quan Đánh Giá */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Cột Điểm Trung Bình */}
        <div className="md:col-span-4 text-center md:border-r md:border-slate-800/80 md:pr-6 space-y-2">
          <div className="text-4xl md:text-5xl font-black text-amber-400 font-mono tracking-tight">
            {avgRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(avgRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Dựa trên <strong>{totalReviews}</strong> đánh giá thực tế
          </p>
        </div>

        {/* Cột Thanh Phân Phối Tỷ Lệ Sao */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.star_counts?.[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-slate-300 flex items-center gap-1 shrink-0">
                  {star} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                <span className="w-14 text-right font-mono text-[11px] text-slate-400 shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thanh Bộ Lọc Đánh Giá */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-sky-400" /> Lọc theo:
        </span>
        <button
          type="button"
          onClick={() => setSelectedRatingFilter(null)}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
            selectedRatingFilter === null
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Tất cả ({totalReviews})
        </button>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.star_counts?.[star] || 0;
          return (
            <button
              key={star}
              type="button"
              onClick={() =>
                setSelectedRatingFilter(selectedRatingFilter === star ? null : star)
              }
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border flex items-center gap-1 ${
                selectedRatingFilter === star
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span>{star}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Danh Sách Đánh Giá */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
              <div className="h-4 bg-slate-800 rounded w-1/4"></div>
              <div className="h-3 bg-slate-800 rounded w-full"></div>
              <div className="h-3 bg-slate-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
          <h4 className="text-sm font-bold text-slate-200">Chưa có đánh giá nào</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {selectedRatingFilter
              ? `Chưa có đánh giá ${selectedRatingFilter} sao nào cho sản phẩm này.`
              : 'Hãy là người đầu tiên trải nghiệm và để lại đánh giá cho sản phẩm này!'}
          </p>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer"
            >
              Viết đánh giá đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const hasLiked = likedReviews[rev.id];
            return (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700/80 transition shadow-xs"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm font-mono">
                      {getInitials(rev.customer_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-100">
                          {rev.customer_name}
                        </span>
                        {rev.is_verified_buyer && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Đã mua hàng
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-500">•</span>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(rev.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Thích / Hữu ích */}
                  <button
                    type="button"
                    onClick={() => handleLike(rev.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                      hasLiked
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title="Đánh giá này hữu ích với bạn"
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-sky-400' : ''}`} />
                    <span className="font-mono text-[11px]">{rev.likes || 0}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-12">
                  {rev.comment}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
