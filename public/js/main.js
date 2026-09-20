/**
 * Techshop Authentication & Validation Frontend Controller
 */

const API_BASE_URL = '/api/auth';

// State Variables
let currentTab = 'login';

document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra xem đã có Token lưu trong LocalStorage chưa
  checkStoredAuth();

  // Đăng ký sự kiện xóa lỗi khi nhập liệu
  setupInputClearErrors();
});

/**
 * Chuyển tab giữa Đăng Nhập và Đăng Ký
 */
function switchTab(tab) {
  currentTab = tab;

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  clearAllErrors();

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.add('active');
    formRegister.classList.remove('active');
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.add('active');
    formLogin.classList.remove('active');
  }
}


/**
 * Bật / Ẩn hiển thị Mật khẩu
 */
function togglePasswordVisibility(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    iconElement.classList.remove('fa-eye-slash');
    iconElement.classList.add('fa-eye');
  } else {
    input.type = 'password';
    iconElement.classList.remove('fa-eye');
    iconElement.classList.add('fa-eye-slash');
  }
}

/**
 * Xử lý ĐĂNG NHẬP
 */
async function handleLogin(e) {
  e.preventDefault();
  clearAllErrors();

  const accountInput = document.getElementById('login-account');
  const passwordInput = document.getElementById('login-password');
  const account = accountInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;

  if (!account) {
    showFieldError('login-account', 'err-login-account', 'Vui lòng nhập Email hoặc Mã tài khoản!');
    isValid = false;
  }

  if (!password) {
    showFieldError('login-password', 'err-login-password', 'Vui lòng nhập mật khẩu!');
    isValid = false;
  }

  if (!isValid) return;

  const btnSubmit = document.getElementById('btn-login');
  setButtonLoading(btnSubmit, true, 'Đang đăng nhập...');

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account,
        password
      })
    });

    const data = await response.json();

    if (data.success) {
      // Lưu Token và User Info vào LocalStorage
      localStorage.setItem('techshop_token', data.token);
      localStorage.setItem('techshop_user', JSON.stringify(data.user));

      showToast(data.message || 'Đăng nhập thành công!', 'success');
      renderUserDashboard(data.user, data.token);
    } else {
      showToast(data.message || 'Đăng nhập thất bại!', 'error');
      showFieldError('login-password', 'err-login-password', data.message);
    }
  } catch (err) {
    console.error(err);
    showToast('Không thể kết nối tới Server!', 'error');
  } finally {
    setButtonLoading(btnSubmit, false, 'Đăng Nhập', 'fa-arrow-right');
  }
}

/**
 * Xử lý ĐĂNG KÝ Khách hàng
 */
async function handleRegister(e) {
  e.preventDefault();
  clearAllErrors();

  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const phoneInput = document.getElementById('reg-phone');
  const addressInput = document.getElementById('reg-address');
  const passwordInput = document.getElementById('reg-password');
  const confirmPasswordInput = document.getElementById('reg-confirm-password');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  let isValid = true;

  // 1. Validate Họ và tên
  if (!name) {
    showFieldError('reg-name', 'err-reg-name', 'Vui lòng nhập Họ và tên!');
    isValid = false;
  } else if (name.length < 2) {
    showFieldError('reg-name', 'err-reg-name', 'Họ và tên quá ngắn!');
    isValid = false;
  }

  // 2. Validate Email
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email) {
    showFieldError('reg-email', 'err-reg-email', 'Vui lòng nhập Email!');
    isValid = false;
  } else if (!emailRegex.test(email)) {
    showFieldError('reg-email', 'err-reg-email', 'Địa chỉ Email không đúng định dạng!');
    isValid = false;
  }

  // 3. Validate Số điện thoại (nếu có nhập)
  if (phone && !/^[0-9]{9,11}$/.test(phone)) {
    showFieldError('reg-phone', 'err-reg-phone', 'Số điện thoại không hợp lệ (9-11 chữ số)!');
    isValid = false;
  }

  // 4. Validate Mật khẩu
  if (!password) {
    showFieldError('reg-password', 'err-reg-password', 'Vui lòng nhập Mật khẩu!');
    isValid = false;
  } else if (password.length < 6) {
    showFieldError('reg-password', 'err-reg-password', 'Mật khẩu phải có ít nhất 6 ký tự!');
    isValid = false;
  }

  // 5. Validate Xác nhận Mật khẩu
  if (!confirmPassword) {
    showFieldError('reg-confirm-password', 'err-reg-confirm-password', 'Vui lòng xác nhận mật khẩu!');
    isValid = false;
  } else if (password !== confirmPassword) {
    showFieldError('reg-confirm-password', 'err-reg-confirm-password', 'Mật khẩu xác nhận không trùng khớp!');
    isValid = false;
  }

  if (!isValid) return;

  const btnSubmit = document.getElementById('btn-register');
  setButtonLoading(btnSubmit, true, 'Đang tạo tài khoản...');

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, address, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('techshop_token', data.token);
      localStorage.setItem('techshop_user', JSON.stringify(data.user));

      showToast(data.message || 'Tạo tài khoản thành công!', 'success');
      renderUserDashboard(data.user, data.token);
    } else {
      showToast(data.message || 'Đăng ký thất bại!', 'error');
      if (data.message.includes('Email')) {
        showFieldError('reg-email', 'err-reg-email', data.message);
      }
    }
  } catch (err) {
    console.error(err);
    showToast('Không thể kết nối tới Server!', 'error');
  } finally {
    setButtonLoading(btnSubmit, false, 'Tạo Tài Khoản Khách Hàng', 'fa-user-check');
  }
}

/**
 * Kiểm tra phiên đăng nhập đã lưu trong LocalStorage
 */
async function checkStoredAuth() {
  const token = localStorage.getItem('techshop_token');
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.success && data.user) {
      renderUserDashboard(data.user, token);
    } else {
      // Token hết hạn hoặc không hợp lệ -> xóa storage
      localStorage.removeItem('techshop_token');
      localStorage.removeItem('techshop_user');
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra Token tự động:', err);
  }
}

/**
 * Kiểm tra thủ công Token JWT thông qua API Protected (/api/auth/me)
 */
async function verifyCurrentToken() {
  const token = localStorage.getItem('techshop_token');
  if (!token) {
    showToast('Không tìm thấy Token!', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
      showToast(`Xác thực Token thành công! Bạn là ${data.user.name} (${data.user.role.toUpperCase()})`, 'success');
    } else {
      showToast(`Token không hợp lệ: ${data.message}`, 'error');
    }
  } catch (err) {
    showToast('Lỗi kiểm tra API Token!', 'error');
  }
}

/**
 * Hiển thị User Dashboard sau khi đăng nhập/đăng ký thành công
 */
function renderUserDashboard(user, token) {
  document.getElementById('auth-card').classList.add('hidden');
  
  const dashCard = document.getElementById('user-dashboard');
  dashCard.classList.remove('hidden');

  document.getElementById('dash-user-name').innerText = user.name || user.email;
  document.getElementById('dash-user-email').innerText = user.email;
  document.getElementById('dash-user-id').innerText = `#${user.id}`;
  
  const roleBadge = document.getElementById('dash-role-badge');
  roleBadge.innerText = (user.role || 'customer').toUpperCase();

  document.getElementById('dash-jwt-token').value = token;
}

/**
 * Đăng xuất
 */
function handleLogout() {
  localStorage.removeItem('techshop_token');
  localStorage.removeItem('techshop_user');

  document.getElementById('user-dashboard').classList.add('hidden');
  document.getElementById('auth-card').classList.remove('hidden');

  showToast('Đã đăng xuất thành công!', 'info');
}

/**
 * Sao chép Token JWT
 */
function copyToken() {
  const tokenTextarea = document.getElementById('dash-jwt-token');
  tokenTextarea.select();
  document.execCommand('copy');
  showToast('Đã sao chép Token JWT vào Khay nhớ tạm (Clipboard)!', 'info');
}

/**
 * Utility: Hiển thị lỗi bên dưới input
 */
function showFieldError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const errSpan = document.getElementById(errorId);
  
  if (input) input.classList.add('invalid');
  if (errSpan) errSpan.innerText = message;
}

/**
 * Utility: Xóa tất cả thông báo lỗi
 */
function clearAllErrors() {
  const invalidInputs = document.querySelectorAll('.input-wrapper input.invalid');
  invalidInputs.forEach(input => input.classList.remove('invalid'));

  const errorSpans = document.querySelectorAll('.error-msg');
  errorSpans.forEach(span => span.innerText = '');
}

/**
 * Đăng ký sự kiện tự xóa highlight lỗi khi người dùng gõ phím
 */
function setupInputClearErrors() {
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      const formGroup = input.closest('.form-group');
      if (formGroup) {
        const errSpan = formGroup.querySelector('.error-msg');
        if (errSpan) errSpan.innerText = '';
      }
    });
  });
}

/**
 * Utility: Trạng thái Nút bấm đang chờ API (Loading spinner)
 */
function setButtonLoading(btn, isLoading, text, iconClass = 'fa-arrow-right') {
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = `<span>${text}</span> <i class="fa-solid ${iconClass}"></i>`;
  }
}

/**
 * Hiển thị Toast Notification góc phải màn hình
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4000);
}
