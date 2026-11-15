
import numpy as np


def cosine_similarity_1v1(u: np.ndarray, v: np.ndarray) -> float:
    """
     Tính độ tương đồng Cosine giữa 2 vector đơn lẻ.
    Nếu vector đã chuẩn hóa L2, chỉ cần tính dot product.
    """
    norm_u = np.linalg.norm(u)
    norm_v = np.linalg.norm(v)

    if norm_u == 0 or norm_v == 0:
        return 0.0

    # Tính tích vô hướng chia cho tích độ dài
    return float(np.dot(u, v) / (norm_u * norm_v))


def batch_cosine_similarity(
    matrix: np.ndarray, query_vector: np.ndarray
) -> np.ndarray:
    """
    Tối ưu hóa phép tính Dot Product trên mảng vector 512D bằng NumPy.
    - matrix: Ma trận chứa N sản phẩm, kích thước (N, 512), đã chuẩn hóa L2 từng dòng.
    - query_vector: Vector truy vấn kích thước (512,), đã chuẩn hóa L2.
    - Trả về: Mảng 1D gồm N điểm tương đồng.
    """
    # Phép nhân ma trận vector tối ưu qua BLAS C: M @ q
    return np.dot(matrix, query_vector)


def find_top_k(
    matrix: np.ndarray,
    query_vector: np.ndarray,
    top_k: int = 10,
    threshold: float = 0.0,
) -> list[tuple[int, float]]:
    """
    
    Tìm Top K chỉ số sản phẩm có độ tương đồng cao nhất.
    Trả về danh sách tuple: [(index_sản_phẩm, điểm_số), ...]
    """
    if matrix.size == 0 or query_vector.size == 0:
        return []

    # 1. Tính toán điểm đồng loạt cho N sản phẩm
    scores = batch_cosine_similarity(matrix, query_vector)

    # 2. Lấy Top K chỉ số có điểm cao nhất (giảm dần)
    # Dùng np.argsort để sắp xếp chỉ số theo thứ tự giảm dần
    sorted_indices = np.argsort(scores)[::-1]

    results = []
    for idx in sorted_indices[:top_k]:
        score = float(scores[idx])
        if score >= threshold:
            results.append((int(idx), round(score, 4)))

    return results


def center_and_normalize(
    vector: np.ndarray, mean_vector: np.ndarray, beta: float = 0.35
) -> np.ndarray:
    """Mean Centering khử anisotropy có hệ số điều hòa beta=0.35
    để bảo toàn tín hiệu cho cả các từ khóa ngắn như 'tai nghe gaming'.
    """
    centered = vector - beta * mean_vector
    norm = np.linalg.norm(centered)
    if norm == 0:
        return centered
    return centered / norm
