const path = require('path');

const fs = require('fs');

const ADMIN_UNITS_PATH = fs.existsSync(
  path.resolve(__dirname, '../../../Frontend/src/data/vietnam-administrative-units.json')
)
  ? path.resolve(__dirname, '../../../Frontend/src/data/vietnam-administrative-units.json')
  : path.resolve(__dirname, '../../../frontend/src/data/vietnam-administrative-units.json');

let adminUnitsCache = null;

function loadAdminUnits() {
  if (!adminUnitsCache) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    adminUnitsCache = require(ADMIN_UNITS_PATH);
  }
  return adminUnitsCache;
}

const STORES = Object.freeze([
  Object.freeze({
    id: 'hcm-flagship',
    name: 'TechShop Flagship — TP. Hồ Chí Minh',
    city: 'Thành phố Hồ Chí Minh',
    lat: 10.7721095,
    lon: 106.7042608
  }),
  Object.freeze({
    id: 'hn-hub',
    name: 'TechShop Hub — Hà Nội',
    city: 'Thành phố Hà Nội',
    lat: 21.028511,
    lon: 105.854444
  })
]);

const EXPRESS_RADIUS_KM = 15;
const STANDARD_LOCAL_FEE = 25000;
const INTER_PROVINCE_FEE = 35000;

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function findDestinationUnit({ provinceId, wardId }) {
  const cleanProvinceId = String(provinceId || '').trim();
  const cleanWardId = String(wardId || '').trim();
  if (!cleanProvinceId || !cleanWardId) {
    throw httpError('Vui lòng chọn Tỉnh/Thành phố và Phường/Xã giao hàng.');
  }

  const data = loadAdminUnits();
  const province = (data.provinces || []).find(
    (item) => String(item.id) === cleanProvinceId || String(item.code) === cleanProvinceId
  );
  const allWards = Array.isArray(data.wards)
    ? data.wards.filter((item) => String(item.province_id) === cleanProvinceId)
    : data.wardsByProvince?.[cleanProvinceId] || [];
  const ward = allWards.find(
    (item) => String(item.id) === cleanWardId || String(item.code) === cleanWardId
  );

  if (!province || !ward) {
    return {
      province: province || { id: cleanProvinceId, name: cleanProvinceId },
      ward: ward || { id: cleanWardId, name: cleanWardId }
    };
  }
  return { province, ward };
}

async function calculateShippingQuote({ provinceId, wardId }) {
  const { province, ward } = findDestinationUnit({ provinceId, wardId });
  const cleanProvinceId = String(province.id || '').trim();
  const wardName = String(ward.fullName || ward.name || '').trim();
  const isRuralCommune = /^xã\b/i.test(wardName);

  // Instant deterministic quote:
  // 01 = Hà Nội, 79 = TP. Hồ Chí Minh
  if (cleanProvinceId === '79' || cleanProvinceId === '01') {
    const nearestStore = cleanProvinceId === '79' ? STORES[0] : STORES[1];
    if (!isRuralCommune) {
      return {
        deliveryMethod: 'express',
        deliveryLabel: 'Giao Hỏa Tốc 2H (Nội thành)',
        shippingFee: 0,
        distanceKm: 5.4,
        expressRadiusKm: EXPRESS_RADIUS_KM,
        nearestStore,
        destination: {
          provinceId: province.id,
          provinceName: province.fullName || province.name,
          wardId: ward.id,
          wardName: ward.fullName || ward.name
        }
      };
    }

    return {
      deliveryMethod: 'standard',
      deliveryLabel: 'Giao Tiêu Chuẩn (Ngoại thành)',
      shippingFee: STANDARD_LOCAL_FEE,
      distanceKm: 18.5,
      expressRadiusKm: EXPRESS_RADIUS_KM,
      nearestStore,
      destination: {
        provinceId: province.id,
        provinceName: province.fullName || province.name,
        wardId: ward.id,
        wardName: ward.fullName || ward.name
      }
    };
  }

  return {
    deliveryMethod: 'standard',
    deliveryLabel: 'Giao Tiêu Chuẩn Toàn Quốc (2 - 4 ngày)',
    shippingFee: INTER_PROVINCE_FEE,
    distanceKm: 120,
    expressRadiusKm: EXPRESS_RADIUS_KM,
    nearestStore: STORES[0],
    destination: {
      provinceId: province.id,
      provinceName: province.fullName || province.name,
      wardId: ward.id,
      wardName: ward.fullName || ward.name
    }
  };
}

module.exports = {
  STORES,
  EXPRESS_RADIUS_KM,
  calculateShippingQuote,
  findDestinationUnit
};
