

from contextlib import asynccontextmanager
import io
import re
import traceback
import unicodedata
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import torch
from transformers import CLIPModel, CLIPProcessor

# Nhập các module đã hoàn thiện
from db import load_products_with_embeddings
from vector_math import center_and_normalize, find_top_k

load_dotenv()

# Ngữ liệu chuẩn tính vector trọng tâm Mean Centering
CALIBRATION_CORPUS = [
     "hôm nay thời tiết rất đẹp và nắng ấm",
    "chúc bạn một ngày mới tràn đầy năng lượng và niềm vui",
    "chúng tôi đang cùng nhau làm việc chăm chỉ",
    "bữa cơm gia đình ấm cúng mỗi buổi chiều",
    "mặt trời mọc ở hướng đông vào mỗi buổi sớm mai",
    "dòng sông trôi êm đềm qua thành phố cổ kính",
    "bầu trời trong xanh và những đám mây trắng bồng bềnh",
    "tiếng chim hót líu lo trên những tán cây xanh",
]


def preprocess_vietnamese_text(text: str) -> str:
    """Làm sạch chuỗi văn bản tiếng Việt"""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text).lower()
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"[^\w\s,\.\-\+]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


ml_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=== [STARTUP] ĐANG KHỞI ĐỘNG AI SEARCH ENGINE ===")
    device = "cpu"
    ml_models["device"] = device

    # 1. Model trích xuất văn bản đa ngôn ngữ
    print("1/4. Nạp Multilingual Text Model...")
    ml_models["text_model"] = SentenceTransformer(
        "sentence-transformers/clip-ViT-B-32-multilingual-v1", device=device
    )

    # 2. Tính toán Vector Trung bình mu (Mean Centering)
    print("2/4. Tính toán Vector Trung Bình (Mean Centering)...")
    cleaned_corpus = [
        preprocess_vietnamese_text(t) for t in CALIBRATION_CORPUS
    ]
    corpus_vecs = ml_models["text_model"].encode(
        cleaned_corpus, normalize_embeddings=False
    )
    ml_models["mean_vector"] = np.mean(corpus_vecs, axis=0)

    # 3. Model Vision CLIP
    print("3/4. Nạp CLIP Vision Model & Processor...")
    clip_id = "openai/clip-vit-base-patch32"
    ml_models["clip_processor"] = CLIPProcessor.from_pretrained(clip_id)
    ml_models["clip_image_model"] = CLIPModel.from_pretrained(clip_id).to(
        device
    )
    ml_models["clip_image_model"].eval()

    # 4. Tải trước các Ma trận vector từ CSDL vào RAM
    print("4/4. Nạp ma trận vector sản phẩm từ MySQL vào RAM...")
    load_product_indices()

    print(
        f"=== [READY] AI SEARCH ENGINE ĐÃ SẴN SÀNG TRÊN [{device.upper()}]! ==="
    )
    yield
    ml_models.clear()


def load_product_indices():
    """Hàm tải / làm mới ma trận vector sản phẩm từ database"""
    for mode in ["text", "image", "hybrid"]:
        prods, matrix = load_products_with_embeddings(mode)
        ml_models[f"{mode}_products"] = prods
        ml_models[f"{mode}_matrix"] = matrix
        print(f"   -> Đã tải {len(prods)} vector sản phẩm cho chế độ [{mode}]")


app = FastAPI(title="Techshop AI Search Engine", lifespan=lifespan)

# Cho phép Frontend React và Node.js Backend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Trích xuất vector ảnh từ bytes file
def extract_image_vector_from_bytes(content: bytes) -> np.ndarray:
    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400, detail="File ảnh bị lỗi hoặc không thể đọc được."
        )

    processor = ml_models["clip_processor"]
    model = ml_models["clip_image_model"]
    device = ml_models["device"]

    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        vision_outputs = model.vision_model(pixel_values=inputs.pixel_values)
        pooled = vision_outputs[1]
        features = model.visual_projection(pooled)
        # Chuẩn hóa L2 norm 
        features = features / torch.norm(features, p=2, dim=-1, keepdim=True)

    return features.cpu().numpy()[0]


# Trích xuất vector text tiếng Việt kèm Mean Centering
def extract_text_vector_str(text: str) -> np.ndarray:
    cleaned = preprocess_vietnamese_text(text)
    if not cleaned:
        raise HTTPException(
            status_code=400, detail="Chuỗi tìm kiếm không hợp lệ."
        )

    model = ml_models["text_model"]
    mean_vec = ml_models["mean_vector"]

    raw_vec = model.encode(cleaned, normalize_embeddings=False)
    # Mean Centering
    return center_and_normalize(raw_vec, mean_vec)


def format_search_results(
    top_indices, product_list, search_type: str = "visual"
):
    results = []
    # Ngưỡng tối thiểu: Semantic >= 50%, Visual/Hybrid >= 60%
    min_threshold = 50.0 if search_type == "semantic" else 60.0

    for idx, score in top_indices:
        if idx < len(product_list):
            item = dict(product_list[idx])
            raw_score = float(score)

            # TÍNH % TƯƠNG ĐỒNG NGUYÊN BẢN (Điểm Cosine chuẩn * 100%)
            percent_val = round(min(100.0, max(0.0, raw_score * 100)), 1)

            # Chỉ lấy sản phẩm đạt đủ ngưỡng quy định
            if percent_val >= min_threshold:
                item["similarity"] = raw_score
                item["similarity_percent"] = f"{percent_val}%"
                results.append(item)

    return results


# ==============================================================
#  SEMANTIC SEARCH API - Tìm kiếm ngữ nghĩa tiếng Việt
# ==============================================================
class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10


@app.post("/api/search/semantic")
async def search_semantic(request: SemanticSearchRequest):
    matrix = ml_models.get("text_matrix")
    products = ml_models.get("text_products", [])

    if matrix is None or matrix.shape[0] == 0:
        raise HTTPException(
            status_code=503,
            detail="Chưa có dữ liệu vector sản phẩm trong database.",
        )

    # 1. Trích xuất vector truy vấn (NFC + Mean Centering)
    q_vec = extract_text_vector_str(request.query)

    # 2. Tìm Top K siêu tốc bằng NumPy Dot Product 
    top_indices = find_top_k(matrix, q_vec, top_k=request.limit)

    return {
        "success": True,
        "search_type": "semantic",
        "query": request.query,
        "total": len(top_indices),
        "results": format_search_results(
            top_indices, products, search_type="semantic"),
    }


# ==============================================================
# VISUAL SEARCH API - Tìm kiếm bằng hình ảnh thiết bị
# ==============================================================
@app.post("/api/search/image")
async def search_image(
    file: UploadFile = File(...),
    limit: int = 10,
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Tệp tải lên không phải ảnh hợp lệ (JPG, PNG, WEBP).",
        )

    matrix = ml_models.get("image_matrix")
    products = ml_models.get("image_products", [])

    if matrix is None or matrix.shape[0] == 0:
        raise HTTPException(
            status_code=503,
            detail="Chưa có dữ liệu vector ảnh sản phẩm trong database.",
        )

    # 1. Đọc và trích xuất vector ảnh truy vấn 
    content = await file.read()
    q_vec = extract_image_vector_from_bytes(content)

    # 2. Tìm Top K bằng phép nhân ma trận
    top_indices = find_top_k(matrix, q_vec, top_k=limit)

    return {
        "success": True,
        "search_type": "visual",
        "filename": file.filename,
        "total": len(top_indices),
        "results": format_search_results(
            top_indices, products, search_type="visual"
        ),
    }


# ==============================================================
# HYBRID SEARCH API - Tìm kiếm kết hợp Ảnh + Văn bản
# ==============================================================
@app.post("/api/search/hybrid")
async def search_hybrid(
    file: UploadFile = File(...),
    text: str = Form(...),
    alpha: float = Form(0.5),
    limit: int = 10,
):
    # Ràng buộc điều kiện: 0 < alpha < 1 để bảo đảm tính chất kết hợp Đa phương thức (Hybrid)
    # Nếu alpha = 0 -> chỉ tìm theo Chữ (Semantic Search thuần túy)
    # Nếu alpha = 1 -> chỉ tìm theo Ảnh (Visual Search thuần túy)
    if alpha <= 0.0 or alpha >= 1.0:
        raise HTTPException(
            status_code=400,
            detail="Trọng số alpha của Hybrid Search phải thỏa mãn điều kiện 0 < alpha < 1 để kết hợp cả hình ảnh và văn bản. (Nếu alpha=0 tương đương Semantic Search, nếu alpha=1 tương đương Visual Search).",
        )

    matrix = ml_models.get("hybrid_matrix")
    products = ml_models.get("hybrid_products", [])

    if matrix is None or matrix.shape[0] == 0:
        raise HTTPException(
            status_code=503,
            detail="Chưa có dữ liệu vector hybrid trong database.",
        )

    # 1. Trích xuất vector Ảnh
    content = await file.read()
    v_img = extract_image_vector_from_bytes(content)

    # 2. Trích xuất vector Văn bản
    v_txt = extract_text_vector_str(text)

    # 3. Kết hợp có trọng số alpha: alpha * v_img + (1 - alpha) * v_txt
    fused = alpha * v_img + (1.0 - alpha) * v_txt
    fused_norm = fused / np.linalg.norm(fused)

    # 4. Tìm Top K
    top_indices = find_top_k(matrix, fused_norm, top_k=limit)

    return {
        "success": True,
        "search_type": "hybrid",
        "text_query": text,
        "filename": file.filename,
        "alpha": alpha,
        "total": len(top_indices),
        "results": format_search_results(
            top_indices, products, search_type="hybrid"
        ),
    }


# Endpoint phụ trợ: Cho phép cập nhật lại RAM khi có thêm sản phẩm mới
@app.post("/api/search/reload-index")
async def reload_index():
    load_product_indices()
    return {
        "success": True,
        "message": "Đã làm mới ma trận vector sản phẩm vào RAM thành công!",
    }


# Giữ lại các endpoint cũ để tương thích
@app.post("/embed-text")
async def embed_text(request: SemanticSearchRequest):
    vec = extract_text_vector_str(request.query)
    return {"dimension": len(vec), "embedding": vec.tolist()}


@app.post("/embed-image")
async def embed_image(file: UploadFile = File(...)):
    content = await file.read()
    vec = extract_image_vector_from_bytes(content)
    return {"dimension": len(vec), "embedding": vec.tolist()}