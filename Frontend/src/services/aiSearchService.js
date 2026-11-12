/**
 * aiSearchService.js
 * Quản lý các cuộc gọi API tìm kiếm AI tới FastAPI Engine (Port 8000)
 */

const AI_BASE_URL = 'http://localhost:8000';

export const aiSearchService = {
    /**
     * Tìm kiếm ngữ nghĩa tiếng Việt
     */
    async searchSemantic(query, limit = 10) {
        const res = await fetch(`${AI_BASE_URL}/api/search/semantic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query.trim(), limit })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.detail || data.message || 'Lỗi tìm kiếm ngữ nghĩa');
        }
        return data;
    },

    /**
     * Tìm kiếm bằng hình ảnh thiết bị
     */
    async searchImage(file, limit = 10) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('limit', limit);

        const res = await fetch(`${AI_BASE_URL}/api/search/image`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.detail || data.message || 'Lỗi tìm kiếm bằng hình ảnh');
        }
        return data;
    },

    /**
     * Tìm kiếm kết hợp Đa phương thức (Hybrid Search)
     */
    async searchHybrid(file, text, alpha = 0.5, limit = 10) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('text', text.trim());
        formData.append('alpha', alpha);
        formData.append('limit', limit);

        const res = await fetch(`${AI_BASE_URL}/api/search/hybrid`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.detail || data.message || 'Lỗi tìm kiếm kết hợp');
        }
        return data;
    }
};