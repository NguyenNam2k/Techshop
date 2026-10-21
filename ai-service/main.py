from contextlib import asynccontextmanager
import io
import traceback
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import torch
from transformers import CLIPModel, CLIPProcessor
import re
import unicodedata
import io
import traceback
from PIL import Image, UnidentifiedImageError
from fastapi import File, HTTPException, UploadFile

def preprocess_vietnamese_text(text: str) -> str:
    """Tiền xử lý chuỗi văn bản đầu vào:

    - Chuẩn hóa Unicode về dạng NFC (chuẩn dựng sẵn tiếng Việt).
    - Chuyển về chữ thường (lowercase).
    - Xóa các khoảng trắng thừa và ký tự điều khiển không nhìn thấy.
    - Giữ lại chữ cái, chữ số và các dấu câu cơ bản.
    """
    if not text:
        return ""

    # 1. Chuẩn hóa bảng mã Unicode về dạng chuẩn NFC
    text = unicodedata.normalize("NFC", text)

    # 2. Chuyển thành chữ thường
    text = text.lower()

    # 3. Thay thế các ký tự xuống dòng, tab bằng khoảng trắng đơn
    text = re.sub(r"[\r\n\t]+", " ", text)

    # 4. Loại bỏ các ký tự đặc biệt lạ hoặc emoji không cần thiết, chỉ giữ chữ cái, số, dấu cách và dấu gạch nối/phẩy
    text = re.sub(r"[^\w\s,\.\-\+]", " ", text, flags=re.UNICODE)

    # 5. Gộp nhiều khoảng trắng liên tiếp thành 1 khoảng trắng duy nhất và xóa khoảng trắng 2 đầu
    text = re.sub(r"\s+", " ", text).strip()

    return text

ml_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- ĐANG TẢI CÁC MODEL CLIP ---")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    ml_models["device"] = device

    # 1. Model trích xuất văn bản đa ngôn ngữ (Hỗ trợ tiếng Việt rất tốt)
    print("1/2 Tải Multilingual Text Model...")
    ml_models["text_model"] = SentenceTransformer(
        "sentence-transformers/clip-ViT-B-32-multilingual-v1", device=device
    )

    # 2. Model và Processor trích xuất ảnh chuẩn CLIP ViT-B-32 (Cùng không gian vector 512D)
    print("2/2 Tải CLIP Image Model & Processor...")
    clip_id = "openai/clip-vit-base-patch32"
    ml_models["clip_processor"] = CLIPProcessor.from_pretrained(clip_id)
    ml_models["clip_image_model"] = CLIPModel.from_pretrained(clip_id).to(
        device
    )
    ml_models["clip_image_model"].eval()

    print(
        f"--- TẤT CẢ MODEL ĐÃ SẴN SÀNG TRÊN [{device.upper()}]! KHỞI ĐỘNG XONG ---"
    )
    yield
    ml_models.clear()


app = FastAPI(title="AI Search Engine", lifespan=lifespan)


class TextEmbedRequest(BaseModel):
    text: str


@app.get("/health")
def health_check():
    return {"status": "ok"}


# [AI-02] Endpoint chuyển đổi văn bản sang vector 512D
@app.post("/embed-text")
async def embed_text(request: TextEmbedRequest):
    # 1. Tiền xử lý và làm sạch chuỗi văn bản
    cleaned_text = preprocess_vietnamese_text(request.text)

    # 2. Kiểm tra tính hợp lệ sau khi làm sạch
    if not cleaned_text:
        raise HTTPException(
            status_code=400,
            detail="Văn bản không hợp lệ hoặc chỉ chứa ký tự đặc biệt rác.",
        )

    print(
        f"[DEBUG] Text gốc: '{request.text}' -> Text đã làm sạch: '{cleaned_text}'"
    )

    try:
        model = ml_models["text_model"]
        # Đưa chuỗi đã làm sạch vào Tokenizer và Model
        vector = model.encode(cleaned_text, normalize_embeddings=True)
        vector_list = vector.tolist()

        return {
            "processed_text": cleaned_text,  # Trả về text đã chuẩn hóa để client dễ debug
            "dimension": len(vector_list),
            "embedding": vector_list,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Lỗi khi xử lý text: {str(e)}"
        )


# [AI-03] Endpoint chuyển đổi hình ảnh sang vector 512D
@app.post("/embed-image")
async def embed_image(file: UploadFile = File(...)):
    # 1. Kiểm tra định dạng hợp lệ
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Tệp tải lên không phải là định dạng hình ảnh hợp lệ (chỉ nhận JPG, PNG, WEBP...).",
        )

    try:
        contents = await file.read()

        # 2. Đọc ảnh bằng PIL và kiểm tra tính toàn vẹn
        image = Image.open(io.BytesIO(contents))
        image.load()

        # 3. Chuẩn hóa hệ màu về RGB (xử lý ảnh RGBA, Grayscale...)
        if image.mode != "RGB":
            image = image.convert("RGB")

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400, detail="File ảnh bị lỗi hoặc không thể đọc được."
        )

    try:
        # 4. Trích xuất vector (processor tự động resize chuẩn 224x224)
        processor = ml_models["clip_processor"]
        model = ml_models["clip_image_model"]
        device = ml_models["device"]

        inputs = processor(images=image, return_tensors="pt").to(device)

        with torch.no_grad():
            outputs = model.get_image_features(**inputs)

            if (
                hasattr(outputs, "pooler_output")
                and outputs.pooler_output is not None
            ):
                image_features = outputs.pooler_output
            elif hasattr(outputs, "last_hidden_state"):
                image_features = outputs.last_hidden_state[:, 0, :]
            else:
                image_features = outputs

            # Chuẩn hóa L2 norm
            image_features = image_features / image_features.norm(
                dim=-1, keepdim=True
            )

        vector_list = image_features.cpu().numpy()[0].tolist()

        return {"dimension": len(vector_list), "embedding": vector_list}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Lỗi khi xử lý ảnh: {str(e)}"
        )