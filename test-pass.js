const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2a$10$lPNLo71FEpwgiqy33Z0Ou.iSVGZlXl1VsUG2ppRZOfcbPpHkBE8WW';
  const passwordsToTest = ['123456', 'customer123', 'admin123', 'tunnhe170309', '12345678'];

  for (const pw of passwordsToTest) {
    const match = await bcrypt.compare(pw, hash);
    console.log(`Testing password "${pw}":`, match ? 'MATCH!' : 'NO MATCH');
  }
}

test();
