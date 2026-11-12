"""
Script: sync_embeddings.py
Mục đích:
- Duyệt qua toàn bộ sản phẩm trong bảng products
- Sinh 3 loại vector (Text, Image, Hybrid) 512D chuẩn hóa
- Lưu trực tiếp vào MySQL bảng product_embeddings
"""

import io
import re
import unicodedata
import httpx
import numpy as np
from PIL import Image
from sentence_transformers import SentenceTransformer
import torch
from transformers import CLIPModel, CLIPProcessor

from db import get_db_connection, insert_product_embedding
from vector_math import center_and_normalize

# 1. Tập ngữ liệu chuẩn tính Mean Centering
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


def preprocess_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text).lower()
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"[^\w\s,\.\-\+]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def main():
    print("=== ĐỒNG BỘ VECTOR CHO SẢN PHẨM TECHSHOP (ITER 2) ===")
    device = "cpu"
    print(f"[*] Thiết bị tính toán: {device.upper()}")

    # 1. Nạp mô hình Text & Image
    print("[1/3] Nạp Multilingual Text Model...")
    text_model = SentenceTransformer(
        "sentence-transformers/clip-ViT-B-32-multilingual-v1", device=device
    )

    # Tính vector trung bình mu cho Mean Centering
    print("      -> Đang tính vector trọng tâm Mean Centering cho văn bản...")
    cleaned_corpus = [preprocess_text(t) for t in CALIBRATION_CORPUS]
    corpus_embeddings = text_model.encode(
        cleaned_corpus, normalize_embeddings=False
    )
    mean_vector = np.mean(corpus_embeddings, axis=0)

    print("[2/3] Nạp CLIP Vision Model & Processor...")
    clip_id = "openai/clip-vit-base-patch32"
    clip_processor = CLIPProcessor.from_pretrained(clip_id)
    clip_model = CLIPModel.from_pretrained(clip_id).to(device)
    clip_model.eval()

    # 2. Lấy danh sách sản phẩm từ database
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, name, brand, description, thumbnail_url FROM products WHERE status != 'archived'"
            )
            products = cursor.fetchall()
    finally:
        conn.close()

    total = len(products)
    print(f"\n[3/3] Bắt đầu sinh vector cho {total} sản phẩm trong CSDL...\n")

#tạo biến lưu ảnh từ url
    http_client = httpx.Client(timeout=15.0)

    for i, prod in enumerate(products, 1):
        pid = prod["id"]
        name = prod["name"]
        brand = prod.get("brand") or ""
        desc = prod.get("description") or ""
        thumb = prod.get("thumbnail_url")

        print(f"[{i}/{total}] Đang xử lý #{pid}: {name[:40]}...")

        # A. Xử lý Text Vector (Áp dụng Mean Centering)
        text_content = f"{name} {brand} {desc}"
        cleaned_text = preprocess_text(text_content)
        raw_text_vec = text_model.encode(
            cleaned_text, normalize_embeddings=False
        )
        centered_text_vec = center_and_normalize(raw_text_vec, mean_vector)
        text_vec_list = centered_text_vec.tolist()

        insert_product_embedding(
            product_id=pid,
            embedding_type="text",
            vector=text_vec_list,
            model_name="clip-ViT-B-32-multilingual-v1",
        )

        # B. Xử lý Image Vector (CLIP Vision L2 norm)
        image_vec = None
        if thumb and thumb.startswith("http"):
            try:
                res = http_client.get(thumb)
                if res.status_code == 200:
                    img = Image.open(io.BytesIO(res.content)).convert("RGB")
                    inputs = clip_processor(images=img, return_tensors="pt").to(
                        device
                    )

                    with torch.no_grad():
                        vision_outputs = clip_model.vision_model(
                            pixel_values=inputs.pixel_values
                        )
                        pooled = vision_outputs[1]
                        features = clip_model.visual_projection(pooled)
                        # Chuẩn hóa L2
                        features = features / torch.norm(
                            features, p=2, dim=-1, keepdim=True
                        )

                    image_vec = features.cpu().numpy()[0]
                    insert_product_embedding(
                        product_id=pid,
                        embedding_type="image",
                        vector=image_vec.tolist(),
                        model_name="openai/clip-vit-base-patch32",
                    )
            except Exception as e:
                print(f"      [!] Lỗi tải ảnh #{pid}: {e}")

        # C. Xử lý Hybrid Vector (50% Ảnh + 50% Text)
        if image_vec is not None:
            fused = 0.5 * image_vec + 0.5 * centered_text_vec
            fused_norm = fused / np.linalg.norm(fused)
            insert_product_embedding(
                product_id=pid,
                embedding_type="hybrid",
                vector=fused_norm.tolist(),
                model_name="hybrid-clip-512d",
            )
        else:
            # Fallback nếu không có ảnh thì lấy text vector
            insert_product_embedding(
                product_id=pid,
                embedding_type="hybrid",
                vector=text_vec_list,
                model_name="hybrid-clip-512d",
            )

    http_client.close()
    print("\n✅ HOÀN TẤT ĐỒNG BỘ TOÀN BỘ VECTOR VÀO BẢNG PRODUCT_EMBEDDINGS!")


if __name__ == "__main__":
    main()