import axios from 'axios';

const CATEGORY_CACHE_KEY = 'techgear_categories_cache_v2';

export const getSessionToken = () => {
  try {
    let token = localStorage.getItem('techgear_session_token');
    if (!token) {
      const bytes = new Uint8Array(24);
      globalThis.crypto.getRandomValues(bytes);
      const randomPart = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      token = `sess_${randomPart}`;
      localStorage.setItem('techgear_session_token', token);
    }
    return token;
  } catch {
    return 'sess_guest_default_token_000001';
  }
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  config.headers['x-session-token'] = getSessionToken();
  return config;
});

const TRANSIENT_STATUSES = new Set([502, 503, 504]);

export const isTransientApiError = (error) => Boolean(error?.techgearTransient);

export function normalizeApiError(error) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;
  const unreachable = !error?.response || TRANSIENT_STATUSES.has(status);

  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    error.message = serverMessage;
    return error;
  }

  if (unreachable && !serverMessage) {
    error.techgearTransient = true;
    error.message =
      'Không kết nối được máy chủ Techshop. Vui lòng kiểm tra kết nối hoặc thử lại sau giây lát.';
  }
  return error;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export async function withTransientRetry(operation, { attempts = 3, delayMs = 600 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientApiError(error) || attempt === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export const api = {
  async getHealth() {
    const res = await apiClient.get('/api/health');
    return res.data;
  },

  // Products & Categories
  async getProducts(params = {}) {
    const res = await apiClient.get('/api/products', { params });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể tải danh sách sản phẩm');
    }
    return res.data;
  },

  async getProductById(id) {
    const res = await apiClient.get(`/api/products/${encodeURIComponent(id)}`);
    if (!res.data?.success || !res.data.data) {
      throw new Error(res.data?.message || 'Không tìm thấy sản phẩm');
    }
    return res.data.data;
  },

  async getSimilarProducts(productId, limit = 8) {
    const res = await apiClient.get(
      `/api/products/${encodeURIComponent(productId)}/similar?limit=${limit}`
    );
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể tải sản phẩm tương tự');
    }
    return res.data.data;
  },

  async reverseImageSearch({ imageUrl, imageName, detectedKeywords, category, brand, limit = 8 } = {}) {
    const res = await apiClient.post('/api/products/reverse-image-search', {
      imageUrl,
      imageName,
      detectedKeywords,
      category,
      brand,
      limit
    });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể tìm kiếm bằng hình ảnh');
    }
    return res.data;
  },

  async getCategories() {
    try {
      const cached = localStorage.getItem(CATEGORY_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) return data;
      }
    } catch {
      // ignore cache errors
    }

    const res = await apiClient.get('/api/products/categories');
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể tải danh mục sản phẩm');
    }

    try {
      localStorage.setItem(
        CATEGORY_CACHE_KEY,
        JSON.stringify({ data: res.data.data, timestamp: Date.now() })
      );
    } catch {
      // ignore cache errors
    }
    return res.data.data;
  },

  // Cart
  async getCart() {
    const res = await apiClient.get('/api/cart');
    if (!res.data?.success) throw new Error(res.data?.message || 'Không thể tải giỏ hàng');
    return res.data.data;
  },

  async syncCart(items) {
    const res = await apiClient.put('/api/cart', { items });
    if (!res.data?.success) throw new Error(res.data?.message || 'Không thể đồng bộ giỏ hàng');
    return res.data.data;
  },

  async addToCart(variantId, quantity = 1, productId) {
    const res = await apiClient.post('/api/cart/items', { variantId, quantity, productId });
    if (!res.data?.success) throw new Error(res.data?.message || 'Không thể thêm vào giỏ hàng');
    return res.data.data;
  },

  async updateCartItem(itemId, { quantity, variantId }) {
    const res = await apiClient.put(`/api/cart/items/${itemId}`, { quantity, variantId });
    if (!res.data?.success) throw new Error(res.data?.message || 'Không thể cập nhật giỏ hàng');
    return res.data.data;
  },

  async removeCartItem(itemId) {
    const res = await apiClient.delete(`/api/cart/items/${itemId}`);
    if (!res.data?.success) throw new Error(res.data?.message || 'Không thể xóa sản phẩm');
    return res.data.data;
  },

  async clearCart() {
    const res = await apiClient.delete('/api/cart/clear');
    if (!res.data?.success) throw new Error(res.data?.message || 'Không thể làm trống giỏ hàng');
    return res.data.data;
  },

  // Coupons
  async getCoupons() {
    const res = await apiClient.get('/api/coupons');
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể tải mã giảm giá');
    }
    return res.data.data || [];
  },

  async validateCoupon(code, orderTotal) {
    try {
      const res = await apiClient.post('/api/coupons/validate', { code, orderTotal });
      return res.data;
    } catch (e) {
      if (e.response?.data) return e.response.data;
      throw e;
    }
  },

  // Shipping & Orders
  async getShippingQuote(provinceId, wardId, signal) {
    const res = await apiClient.post(
      '/api/shipping/quote',
      { provinceId, wardId },
      { signal, timeout: 10000 }
    );
    if (!res.data?.success || !res.data.data) {
      throw new Error(res.data?.message || 'Không thể ước tính phí giao hàng.');
    }
    return res.data.data;
  },

  async createOrder(orderData) {
    const res = await apiClient.post('/api/orders', orderData, { timeout: 20000 });
    return res.data;
  },

  async getOrder(orderCode) {
    const res = await apiClient.get(`/api/orders/${encodeURIComponent(orderCode)}`);
    return res.data;
  },

  async getPaymentStatus(orderCode) {
    const res = await apiClient.get(`/api/payments/status/${encodeURIComponent(orderCode)}`);
    return res.data?.data;
  },

  async simulatePayment(orderCode) {
    const res = await apiClient.post('/api/payments/simulate', { orderCode });
    return res.data;
  },

  async getOrders(params = {}) {
    const res = await apiClient.get('/api/orders', { params });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể tải danh sách đơn hàng');
    }
    return res.data.data || [];
  },

  // Customer Profile & Security
  async getProfile(id) {
    const res = await apiClient.get('/api/customer/profile', { params: id ? { id } : {} });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể tải thông tin hồ sơ');
    }
    return res.data.data;
  },

  async updateProfile(data) {
    const res = await apiClient.put('/api/customer/profile', data);
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể cập nhật hồ sơ');
    }
    return res.data;
  },

  async changePassword(data) {
    const res = await apiClient.put('/api/customer/change-password', data);
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể đổi mật khẩu');
    }
    return res.data;
  },

  async updateAddresses(addresses) {
    const res = await apiClient.put('/api/customer/addresses', { addresses });
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi lưu sổ địa chỉ');
    return res.data;
  },

  async updatePaymentMethods(methods) {
    const res = await apiClient.put('/api/customer/payment-methods', { methods });
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi lưu phương thức thanh toán');
    return res.data;
  },

  async updateWishlist(wishlist) {
    const res = await apiClient.put('/api/customer/wishlist', { wishlist });
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi lưu danh sách yêu thích');
    return res.data;
  },

  async updatePCBuilds(pcBuilds) {
    const res = await apiClient.put('/api/customer/pc-builds', { pcBuilds });
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi lưu cấu hình PC');
    return res.data;
  },

  async saveVoucher(code) {
    const res = await apiClient.post('/api/customer/vouchers', { code });
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi lưu voucher');
    return res.data;
  },

  async redeemPoints(cost, rewardTitle) {
    const res = await apiClient.post('/api/customer/redeem-points', { cost, rewardTitle });
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi đổi điểm');
    return res.data;
  },

  async createTicket(ticketData) {
    const res = await apiClient.post('/api/customer/tickets', ticketData);
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi mở ticket');
    return res.data;
  },

  async submitReview(reviewData) {
    const res = await apiClient.post('/api/customer/reviews', reviewData);
    if (!res.data?.success) throw new Error(res.data?.message || 'Lỗi gửi đánh giá');
    return res.data;
  }
};
