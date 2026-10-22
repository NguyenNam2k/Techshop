---
trigger: always_on
---

# Quy tắc làm việc với Git

## 1. Không tự ý Push code lên GitHub
- **TUYỆT ĐỐI KHÔNG** tự ý thực hiện lệnh `git push` lên remote repository.
- Chỉ tạo commit (hoặc stage code) ở local và thông báo cho người dùng.
- Để người dùng chủ động kiểm tra và tự push code lên GitHub (qua GitHub Desktop hoặc terminal) khi họ sẵn sàng, tránh việc đẩy code lên liên tục.

## 2. Quy chuẩn Commit Message
- Luôn viết commit message bằng **tiếng Việt**, ngắn gọn, rõ ràng, dễ hiểu cho các thành viên trong nhóm.
- **KHÔNG dùng các tiền tố tiếng Anh** như `style:`, `feat:`, `fix:`, `refactor:`, `chore:`, v.v. Viết trực tiếp nội dung bằng tiếng Việt (ví dụ: `dinh dang chuan hoa index.css`, `cap nhat chuc nang dang nhap`).