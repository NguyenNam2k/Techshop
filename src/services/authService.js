const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const Customer = require('../repositories/CustomerRepository');
const Admin = require('../repositories/AdminRepository');
const Manager = require('../repositories/ManagerRepository');
const Staff = require('../repositories/StaffRepository');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authService = {
  /**
   * Logic Đăng ký tài khoản Khách hàng
   */
  register: async ({ name, username, email, password, phone, address }) => {
    if (!name || !name.trim()) {
      throw { status: 400, message: 'Vui lòng nhập Họ và tên!' };
    }

    if (!username || !username.trim()) {
      throw { status: 400, message: 'Vui lòng nhập Tên đăng nhập!' };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      throw { status: 400, message: 'Tên đăng nhập từ 3-30 ký tự, gồm chữ cái, chữ số và dấu _ !' };
    }

    if (!email || !email.trim()) {
      throw { status: 400, message: 'Vui lòng nhập Email!' };
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      throw { status: 400, message: 'Định dạng Email không hợp lệ!' };
    }

    if (!password || password.length < 6) {
      throw { status: 400, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' };
    }

    if (!phone || !phone.trim()) {
      throw { status: 400, message: 'Vui lòng nhập Số điện thoại!' };
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      throw { status: 400, message: 'Số điện thoại phải đúng 10 chữ số!' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Kiểm tra xem Username hoặc Email đã tồn tại chưa
    const existingUserByEmail = await Customer.findByEmail(cleanEmail);
    if (existingUserByEmail) {
      throw { status: 400, message: 'Email này đã được đăng ký tài khoản! Vui lòng sử dụng email khác.' };
    }

    const existingUserByUsername = await Customer.findByUsername(cleanUsername);
    if (existingUserByUsername) {
      throw { status: 400, message: 'Tên đăng nhập này đã được sử dụng! Vui lòng chọn tên đăng nhập khác.' };
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Tạo Customer mới
    const newCustomerId = await Customer.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password_hash,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      status: 'active'
    });

    const role = 'customer';

    // Tạo JWT Token
    const payload = {
      id: newCustomerId,
      name: name.trim(),
      email: cleanEmail,
      role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'techshop_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        id: newCustomerId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role
      }
    };
  },

  /**
   * Logic Đăng nhập (Hỗ trợ Customer, Admin, Manager, Staff)
   */
  login: async ({ account, password, roleType }) => {
    if (!account || !account.trim()) {
      throw { status: 400, message: 'Vui lòng nhập Email hoặc Tên đăng nhập!' };
    }

    if (!password) {
      throw { status: 400, message: 'Vui lòng nhập Mật khẩu!' };
    }

    const cleanAccount = account.trim();
    let user = null;
    let resolvedRole = 'customer';

    if (roleType === 'admin') {
      user = await Admin.findByAccount(cleanAccount);
      if (user) resolvedRole = 'admin';
    } else if (roleType === 'manager') {
      user = await Manager.findByAccount(cleanAccount);
      if (user) resolvedRole = 'manager';
    } else if (roleType === 'staff') {
      user = await Staff.findByAccount(cleanAccount);
      if (user) resolvedRole = 'staff';
    } else {
      // Tra cứu ưu tiên: Customer -> Admin -> Manager -> Staff
      user = await Customer.findByAccount(cleanAccount);
      if (user) {
        resolvedRole = 'customer';
      } else {
        user = await Admin.findByAccount(cleanAccount);
        if (user) {
          resolvedRole = 'admin';
        } else {
          user = await Manager.findByAccount(cleanAccount);
          if (user) {
            resolvedRole = 'manager';
          } else {
            user = await Staff.findByAccount(cleanAccount);
            if (user) {
              resolvedRole = 'staff';
            }
          }
        }
      }
    }

    if (!user) {
      throw { status: 400, message: 'Tài khoản hoặc mật khẩu không chính xác!' };
    }

    if (user.status === 'blocked' || user.status === 'inactive') {
      throw { status: 403, message: 'Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động. Vui lòng liên hệ quản trị viên!' };
    }

    if (!user.password_hash) {
      throw { status: 400, message: 'Tài khoản này chưa tạo mật khẩu (có thể sử dụng đăng nhập Google)!' };
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      throw { status: 400, message: 'Tài khoản hoặc mật khẩu không chính xác!' };
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: resolvedRole
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'techshop_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: resolvedRole
      }
    };
  },

  /**
   * Logic Lấy thông tin cá nhân hiện tại
   */
  getProfile: async (id, role) => {
    let userData = null;

    if (role === 'customer') {
      userData = await Customer.findByIdForProfile(id);
    } else if (role === 'admin') {
      userData = await Admin.findByIdForProfile(id);
    } else if (role === 'manager') {
      userData = await Manager.findByIdForProfile(id);
    } else if (role === 'staff') {
      userData = await Staff.findByIdForProfile(id);
    }

    if (!userData) {
      throw { status: 404, message: 'Không tìm thấy thông tin người dùng!' };
    }

    userData.role = role;
    return userData;
  },

  /**
   * Logic Xác thực bằng Google OAuth 2.0
   */
  googleAuth: async ({ credential, isAccessToken }) => {
    if (!credential) {
      throw { status: 400, message: 'Thiếu Google credential token!' };
    }

    let googleId, email, name, picture;

    if (isAccessToken) {
      const https = require('https');
      const userInfo = await new Promise((resolve, reject) => {
        https.get(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credential}`,
          (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
              try { resolve(JSON.parse(data)); }
              catch (e) { reject(e); }
            });
          }
        ).on('error', reject);
      });

      if (userInfo.error || !userInfo.sub) {
        throw { status: 401, message: 'Access token Google không hợp lệ!' };
      }

      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    if (!email) {
      throw { status: 400, message: 'Không lấy được email từ tài khoản Google!' };
    }

    let user = await Customer.findByGoogleId(googleId);
    let isNewUser = false;

    if (!user) {
      const existingUser = await Customer.findByEmail(email.toLowerCase());

      if (existingUser) {
        user = existingUser;
        await Customer.updateGoogleId(user.id, googleId, picture || null);
      } else {
        const newId = await Customer.createFromGoogle({
          name,
          email: email.toLowerCase(),
          google_id: googleId,
          avatar_url: picture || null,
          status: 'active'
        });
        isNewUser = true;
        user = { id: newId, name, email: email.toLowerCase(), status: 'active' };
      }
    }

    if (user.status === 'blocked' || user.status === 'inactive') {
      throw { status: 403, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!' };
    }

    const jwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'customer'
    };

    const token = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET || 'techshop_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      isNewUser,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'customer',
        avatar: picture || null,
        isNewUser
      }
    };
  }
};

module.exports = authService;
