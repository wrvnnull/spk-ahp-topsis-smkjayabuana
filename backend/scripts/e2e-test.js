const BASE = 'http://localhost:3000';
const request = (options) => new Promise((resolve, reject) => {
  const req = require('http').request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try { data = JSON.parse(data); } catch (e) {}
      resolve({ status: res.statusCode, headers: res.headers, body: data });
    });
  });
  req.on('error', reject);
  if (options.body) req.write(options.body);
  req.end();
});

async function main() {
  console.log('=== E2E BACKEND VALIDATION ===\n');
  
  // 1. Login as SUPER_ADMIN
  const adminLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@contoh.sch.id', password: process.env.SEED_ADMIN_PASSWORD || '' })
  });
  console.log('[1] Login SUPER_ADMIN:', adminLogin.status, adminLogin.body?.message || adminLogin.body);
  if (adminLogin.status !== 200) { console.log('FAILED TO LOGIN ADMIN, abort'); process.exit(1); }
  const adminCookie = adminLogin.headers['set-cookie'];
  if (!adminCookie) { console.log('NO COOKIE FROM ADMIN LOGIN'); process.exit(1); }
  console.log('    Got cookie, length:', adminCookie.join('; ').length);
  
  // 2. Login as GURU
  const guruLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'guru@contoh.sch.id', password: process.env.SEED_GURU_PASSWORD || '' })
  });
  console.log('[2] Login GURU:', guruLogin.status, guruLogin.body?.message || guruLogin.body);
  const guruCookie = guruLogin.headers['set-cookie'];
  
  // 3. Login as KEPALA_SEKOLAH
  const kepalaLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kepala@contoh.sch.id', password: process.env.SEED_KEPSK_PASSWORD || '' })
  });
  console.log('[3] Login KEPALA_SEKOLAH:', kepalaLogin.status, kepalaLogin.body?.message || kepalaLogin.body);
  const kepalaCookie = kepalaLogin.headers['set-cookie'];
  
  // Helper with cookie
  const authReq = async (path, method = 'GET', body = null, cookie) => {
    const opts = {
      hostname: 'localhost', port: 3000, path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (cookie) {
      if (Array.isArray(cookie)) cookie = cookie.join('; ');
      opts.headers['Cookie'] = cookie;
    }
    if (body) opts.body = JSON.stringify(body);
    return request(opts);
  };
  
  // 4. Get academic periods (SUPER_ADMIN)
  const periods = await authReq('/api/academic-periods', 'GET', null, adminCookie);
  console.log('\n[4] GET /api/academic-periods (SUPER_ADMIN):', periods.status);
  const periodId = periods.body?.[0]?.id;
  console.log('    Periods:', JSON.stringify(periods.body?.map(p => ({ id: p.id, name: p.name, is_active: p.is_active })), null, 2));
  
  // 5. Get criteria (SUPER_ADMIN)
  const criteria = await authReq('/api/criteria', 'GET', null, adminCookie);
  console.log('\n[5] GET /api/criteria (SUPER_ADMIN):', criteria.status);
  console.log('    Criteria:', JSON.stringify(criteria.body, null, 2));
  const criteriaList = criteria.body || [];
  console.log('    Active criteria count:', criteriaList.filter(c => c.is_active).length);
  
  // 6. Get AHP comparisons (SUPER_ADMIN)
  const comps = await authReq('/api/ahp/comparisons', 'GET', null, adminCookie);
  console.log('\n[6] GET /api/ahp/comparisons (SUPER_ADMIN):', comps.status);
  console.log('    Comparisons count:', (comps.body || []).length);
  console.log('    Sample:', JSON.stringify((comps.body || []).slice(0, 3), null, 2));
  
  // 7. Try AHP calculate - check if we can trigger it
  const ahpCalcReq = await authReq('/api/ahp/calculate', 'POST', { academic_period_id: periodId }, adminCookie);
  console.log('\n[7] POST /api/ahp/calculate (SUPER_ADMIN):', ahpCalcReq.status);
  console.log('    Response:', JSON.stringify(ahpCalcReq.body, null, 2));
  if (ahpCalcReq.status === 200 || ahpCalcReq.status === 201) {
    const ahpId = ahpCalcReq.body?.id;
    if (ahpId) {
      // 8. Get AHP calculations
      const ahpCalcs = await authReq('/api/ahp/calculations', 'GET', null, adminCookie);
      console.log('\n[8] GET /api/ahp/calculations (SUPER_ADMIN):', ahpCalcs.status);
      console.log('    AHP calculations:', JSON.stringify(ahpCalcs.body, null, 2));
      
      // 9. Get specific AHP calculation
      const ahpCalc = await authReq(`/api/ahp/calculations/${ahpId}`, 'GET', null, adminCookie);
      console.log('\n[9] GET /api/ahp/calculations/${ahpId} (SUPER_ADMIN):', ahpCalc.status);
      console.log('    AHP result:', JSON.stringify(ahpCalc.body, null, 2));
      
      // Check if weight_vector sums to ~1
      const wv = ahpCalc.body?.weight_vector || {};
      const wvSum = Object.values(wv).reduce((a, b) => a + b, 0);
      console.log('    Weight vector sum:', wvSum.toFixed(4), '(should be ~1.0)');
      console.log('    λmax:', ahpCalc.body?.lambda_max);
      console.log('    CI:', ahpCalc.body?.ci);
      console.log('    CR:', ahpCalc.body?.cr);
      console.log('    is_valid:', ahpCalc.body?.is_valid);
    }
  }
  
  // 10. Try TOPSIS calculate
  if (ahpId) {
    const topsisCalcReq = await authReq('/api/topsis/calculate', 'POST', { academic_period_id: periodId, ahp_calculation_id: ahpId }, adminCookie);
    console.log('\n[10] POST /api/topsis/calculate (SUPER_ADMIN):', topsisCalcReq.status);
    console.log('    Response:', JSON.stringify(topsisCalcReq.body, null, 2));
    if (topsisCalcReq.status === 200 || topsisCalcReq.status === 201) {
      const topId = topsisCalcReq.body?.id;
      if (topId) {
        // 11. Get TOPSIS ranking
        const ranking = await authReq('/api/topsis/ranking', 'GET', null, adminCookie);
        console.log('\n[11] GET /api/topsis/ranking (SUPER_ADMIN):', ranking.status);
        console.log('    Ranking:', JSON.stringify(ranking.body, null, 2));
        
        // 12. Get specific TOPSIS calculation
        const topCalc = await authReq(`/api/topsis/calculations/${topId}`, 'GET', null, adminCookie);
        console.log('\n[12] GET /api/topsis/calculations/${topId} (SUPER_ADMIN):', topCalc.status);
        console.log('    TOPSIS result:', JSON.stringify(topCalc.body, null, 2));
      }
    }
  }
  
  // RBAC tests
  console.log('\n=== RBAC TESTS ===');
  
  // 13. GURU try AHP calculate (should 403)
  if (periodId) {
    const guruAHP = await authReq('/api/ahp/calculate', 'POST', { academic_period_id: periodId }, guruCookie);
    console.log('\n[13] GURU POST /api/ahp/calculate:', guruAHP.status, '(expect 403)');
    console.log('    Response:', JSON.stringify(guruAHP.body, null, 2));
  }
  
  // 14. GURU try TOPSIS calculate (should 403)
  if (periodId && ahpId) {
    const guruTOPSIS = await authReq('/api/topsis/calculate', 'POST', { academic_period_id: periodId, ahp_calculation_id: ahpId }, guruCookie);
    console.log('\n[14] GURU POST /api/topsis/calculate:', guruTOPSIS.status, '(expect 403)');
    console.log('    Response:', JSON.stringify(guruTOPSIS.body, null, 2));
  }
  
  // 15. KEPALA_SEKOLAH read AHP calculations (should 200)
  if (periodId) {
    const kepalaAHP = await authReq('/api/ahp/calculations', 'GET', null, kepalaCookie);
    console.log('\n[15] KEPALA_SEKOLAH GET /api/ahp/calculations:', kepalaAHP.status, '(expect 200)');
    console.log('    Response:', JSON.stringify(kepalaAHP.body, null, 2));
  }
  
  // 16. KEPALA_SEKOLAH read TOPSIS ranking (should 200)
  const kepalaTOPSIS = await authReq('/api/topsis/ranking', 'GET', null, kepalaCookie);
  console.log('\n[16] KEPALA_SEKOLAH GET /api/topsis/ranking:', kepalaTOPSIS.status, '(expect 200)');
  console.log('    Response:', JSON.stringify(kepalaTOPSIS.body, null, 2));
  
  // 17. KEPALA_SEKOLAH read TOPSIS calculation detail (should 200)
  if (ahpId && topId) {
    const kepalaTopCalc = await authReq(`/api/topsis/calculations/${topId}`, 'GET', null, kepalaCookie);
    console.log('\n[17] KEPALA_SEKOLAH GET /api/topsis/calculations/${topId}:', kepalaTopCalc.status, '(expect 200)');
    console.log('    Response:', JSON.stringify(kepalaTopCalc.body, null, 2));
  }
  
  console.log('\n=== E2E VALIDATION COMPLETE ===');
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
