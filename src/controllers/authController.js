const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Đăng ký tài khoản Khách hàng (Customer)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào (Validation)
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Họ và tên!' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Email!' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Định dạng Email không hợp lệ!' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Số điện thoại!' });
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Số điện thoại phải đúng 10 chữ số!' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Kiểm tra xem Email đã tồn tại trong bảng customers chưa
    const [existingUsers] = await db.query(
      'SELECT id FROM customers WHERE email = ?',
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký tài khoản! Vui lòng sử dụng email khác hoặc đăng nhập.'
      });
    }

    // 3. Mã hóa mật khẩu với bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Lưu thông tin khách hàng mới vào CSDL
    const [result] = await db.query(
      'INSERT INTO customers (name, email, password_hash, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, password_hash, phone ? phone.trim() : null, address ? address.trim() : null, 'active']
    );

    const newCustomerId = result.insertId;
    const role = 'customer';

    // 5. Tạo JWT Token
    const payload = {
      id: newCustomerId,
      name: name.trim(),
      email: cleanEmail,
      role: role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'techshop_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 6. Trả về kết quả thành công
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản Techshop thành công!',
      token,
      user: {
        id: newCustomerId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role
      }
    });

  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra trên hệ thống khi đăng ký tài khoản!',
      error: error.message
    });
  }
};

/**
 * Đăng nhập (Hỗ trợ Khách hàng, Quản trị viên, Quản lý, Nhân viên)
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { account, password, roleType } = req.body;

    // 1. Validation
    if (!account || !account.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Email hoặc Tên đăng nhập!' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Mật khẩu!' });
    }

    const cleanAccount = account.trim();
    let user = null;
    let resolvedRole = 'customer';

    // 2. Tra cứu tài khoản theo từng bảng tùy theo roleType hoặc tìm kiếm tự động
    if (roleType === 'admin') {
      const [rows] = await db.query(
        'SELECT id, username, email, password_hash, full_name as name, status FROM admins WHERE email = ? OR username = ?',
        [cleanAccount, cleanAccount]
      );
      if (rows.length > 0) {
        user = rows[0];
        resolvedRole = 'admin';
      }
    } else if (roleType === 'manager') {
      const [rows] = await db.query(
        'SELECT id, manager_code, email, password_hash, full_name as name, status FROM managers WHERE email = ? OR manager_code = ?',
        [cleanAccount, cleanAccount]
      );
      if (rows.length > 0) {
        user = rows[0];
        resolvedRole = 'manager';
      }
    } else if (roleType === 'staff') {
      const [rows] = await db.query(
        'SELECT id, staff_code, email, password_hash, full_name as name, status FROM staffs WHERE email = ? OR staff_code = ?',
        [cleanAccount, cleanAccount]
      );
      if (rows.length > 0) {
        user = rows[0];
        resolvedRole = 'staff';
      }
    } else {
      // Mặc định hoặc tra cứu ưu tiên: Customer -> Admin -> Manager -> Staff
      const [custRows] = await db.query(
        'SELECT id, email, password_hash, name, status FROM customers WHERE email = ?',
        [cleanAccount.toLowerCase()]
      );

      if (custRows.length > 0) {
        user = custRows[0];
        resolvedRole = 'customer';
      } else {
        // Kiểm tra trong admins
        const [adminRows] = await db.query(
          'SELECT id, username, email, password_hash, full_name as name, status FROM admins WHERE email = ? OR username = ?',
          [cleanAccount, cleanAccount]
        );
        if (adminRows.length > 0) {
          user = adminRows[0];
          resolvedRole = 'admin';
        } else {
          // Kiểm tra trong managers
          const [managerRows] = await db.query(
            'SELECT id, manager_code, email, password_hash, full_name as name, status FROM managers WHERE email = ? OR manager_code = ?',
            [cleanAccount, cleanAccount]
          );
          if (managerRows.length > 0) {
            user = managerRows[0];
            resolvedRole = 'manager';
          } else {
            // Kiểm tra trong staffs
            const [staffRows] = await db.query(
              'SELECT id, staff_code, email, password_hash, full_name as name, status FROM staffs WHERE email = ? OR staff_code = ?',
              [cleanAccount, cleanAccount]
            );
            if (staffRows.length > 0) {
              user = staffRows[0];
              resolvedRole = 'staff';
            }
          }
        }
      }
    }

    // 3. Nếu không tìm thấy người dùng
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác!'
      });
    }

    // 4. Kiểm tra trạng thái tài khoản
    if (user.status === 'blocked' || user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa hoặc ngưng hoạt động. Vui lòng liên hệ quản trị viên!'
      });
    }

    // 5. Xác thực mật khẩu với bcrypt
    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này chưa tạo mật khẩu (có thể sử dụng đăng nhập Google)!'
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác!'
      });
    }

    // 6. Tạo Token JWT
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

    // 7. Trả về thông tin thành công
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: resolvedRole
      }
    });

  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra trên hệ thống khi đăng nhập!',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin cá nhân của người dùng hiện tại (Protected)
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;

    let tableName = 'customers';
    if (role === 'admin') tableName = 'admins';
    if (role === 'manager') tableName = 'managers';
    if (role === 'staff') tableName = 'staffs';

    const [rows] = await db.query(
      `SELECT id, email, status, created_at ${role === 'customer' ? ', name, phone, address, avatar_url' : ', full_name as name, phone, avatar_url'} FROM ${tableName} WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(444).json({ success: false, message: 'Không tìm thấy thông tin người dùng!' });
    }

    const userData = rows[0];
    userData.role = role;

    return res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('[GetMe Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin tài khoản!',
      error: error.message
    });
  }
};

/**
 * Đăng nhập / Đăng ký bằng Google OAuth 2.0
 * POST /api/auth/google
 * Body: { credential: "<Google JWT hoặc access_token>", isAccessToken?: boolean }
 */
const googleAuth = async (req, res) => {
  try {
    const { credential, isAccessToken } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Thiếu Google credential token!' });
    }

    let googleId, email, name, picture;

    if (isAccessToken) {
      // Implicit flow: dùng access_token để lấy userinfo từ Google
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
        return res.status(401).json({ success: false, message: 'Access token Google không hợp lệ!' });
      }

      googleId = userInfo.sub;
      email    = userInfo.email;
      name     = userInfo.name;
      picture  = userInfo.picture;
    } else {
      // Authorization code flow: verify ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email    = payload.email;
      name     = payload.name;
      picture  = payload.picture;
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Không lấy được email từ tài khoản Google!' });
    }

    // 2. Tìm customer theo google_id trước
    let [rows] = await db.query(
      'SELECT id, name, email, google_id, status FROM customers WHERE google_id = ?',
      [googleId]
    );

    let user = rows[0] || null;
    let isNewUser = false;

    if (!user) {
      // 3. Tìm theo email (tài khoản email/password đã tồn tại)
      const [emailRows] = await db.query(
        'SELECT id, name, email, google_id, status FROM customers WHERE email = ?',
        [email.toLowerCase()]
      );

      if (emailRows.length > 0) {
        // Email đã tồn tại → link google_id vào tài khoản cũ
        user = emailRows[0];
        await db.query(
          'UPDATE customers SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
          [googleId, picture || null, user.id]
        );
      } else {
        // 4. Tạo tài khoản mới từ Google
        const [result] = await db.query(
          'INSERT INTO customers (name, email, google_id, avatar_url, password_hash, status) VALUES (?, ?, ?, ?, NULL, ?)',
          [name, email.toLowerCase(), googleId, picture || null, 'active']
        );
        isNewUser = true;
        user = { id: result.insertId, name, email: email.toLowerCase(), status: 'active' };
      }
    }

    // 5. Kiểm tra trạng thái tài khoản
    if (user.status === 'blocked' || user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!'
      });
    }

    // 6. Tạo JWT nội bộ
    const jwtPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'customer'
    };

    const token = require('jsonwebtoken').sign(
      jwtPayload,
      process.env.JWT_SECRET || 'techshop_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? 'Đăng ký tài khoản Google thành công!' : 'Đăng nhập Google thành công!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'customer',
        avatar: picture || null,
        isNewUser
      }
    });

  } catch (error) {
    console.error('[GoogleAuth Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Xác thực Google thất bại!',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleAuth
};
