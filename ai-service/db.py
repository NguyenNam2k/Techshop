"""
Module: db.py
Mục đích: Quản lý kết nối MySQL và truy xuất dữ liệu từ bảng products & product_embeddings.
"""

import json
import os
import numpy as np
import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

# Nạp cấu hình từ .env gốc hoặc .env của ai-service
load_dotenv(dotenv_path="../.env")
load_dotenv()


def get_db_connection():
    """Tạo kết nối tới MySQL database techshop_db"""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "Duong@741268"),
        database=os.getenv("DB_NAME", "techshop_db"),
        port=int(os.getenv("DB_PORT", 3306)),
        cursorclass=DictCursor,
        autocommit=True,
    )


def load_products_with_embeddings(embedding_type: str = "text"):
    """
    Tải danh sách sản phẩm kèm mảng ma trận vector từ Database.
    - embedding_type: 'text', 'image' hoặc 'hybrid'
    - Trả về: (products_list, vector_matrix)
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    p.id, p.name, p.slug, p.brand, p.base_price, p.thumbnail_url, p.description,
                    pe.vector, pe.embedding_type
                FROM products p
                INNER JOIN product_embeddings pe ON p.id = pe.product_id
                WHERE pe.embedding_type = %s AND p.status IN ('active', 'out_of_stock')
            """
            cursor.execute(sql, (embedding_type,))
            rows = cursor.fetchall()

            products = []
            vectors = []

            for row in rows:
                raw_vec = row.pop("vector")
                if isinstance(raw_vec, str):
                    vec_list = json.loads(raw_vec)
                else:
                    vec_list = raw_vec

                # Chuẩn hóa L2 norm đề phòng vector lưu chưa chuẩn
                v = np.array(vec_list, dtype=np.float32)
                norm = np.linalg.norm(v)
                if norm > 0:
                    v = v / norm

                vectors.append(v)
                products.append(row)

            if len(vectors) == 0:
                return [], np.empty((0, 512), dtype=np.float32)

            matrix = np.vstack(vectors)
            return products, matrix

    finally:
        connection.close()


def insert_product_embedding(
    product_id: int,
    embedding_type: str,
    vector: list[float],
    model_name: str = "clip-ViT-B-32",
):
    """Lưu hoặc cập nhật vector embedding của 1 sản phẩm vào bảng product_embeddings"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Kiểm tra xem sản phẩm đã có vector loại này chưa
            check_sql = """
                SELECT id FROM product_embeddings 
                WHERE product_id = %s AND embedding_type = %s 
                LIMIT 1
            """
            cursor.execute(check_sql, (product_id, embedding_type))
            existing = cursor.fetchone()

            if existing:
                update_sql = """
                    UPDATE product_embeddings 
                    SET vector = %s, model_name = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """
                cursor.execute(
                    update_sql,
                    (json.dumps(vector), model_name, existing["id"]),
                )
            else:
                insert_sql = """
                    INSERT INTO product_embeddings 
                        (product_id, embedding_type, vector, model_name)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(
                    insert_sql,
                    (product_id, embedding_type, json.dumps(vector), model_name),
                )
    finally:
        connection.close()