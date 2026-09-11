// =============================================================================
// E2E Full Backend Test - End-to-End test lengkap alur SPK AHP-TOPSIS
// =============================================================================
// Script ini mensimulasikan alur end-to-end:
//   1. Login SUPER_ADMIN, GURU, KEPALA_SEKOLAH
//   2. Buat AHP pairwise comparisons untuk kriteria aktif
//   3. Hitung AHP
//   4. Hitung TOPSIS
//   5. Verifikasi ranking
//   6. Tes RBAC (GURU seharusnya 403, KEPALA_SEKOLAH 200)
//
// PERLU environment variable (set sebelum menjalankan):
//   SEED_ADMIN_PASSWORD    - password akun SUPER_ADMIN (admin@contoh.sch.id)
//   SEED_GURU_PASSWORD     - password akun GURU (guru@contoh.sch.id)
//   SEED_KEPSK_PASSWORD    - password akun KEPALA_SEKOLAH (kepsek@contoh.sch.id)
//
// CATATAN:
//   - Script ini melakukan WRITE ke database (membuat comparisons, AHP calc, TOPSIS calc).
//   - Gunakan hanya di environment development/test yang terisolasi.
//   - Jangan jalankan di production database.
//   - Email yang digunakan adalah dummy/seed account, bukan data siswa asli.
//
// PERSIAPAN:
//   - Backend harus sudah berjalan di http://localhost:3000
//   - Database sudah memiliki seed data dengan email sesuai di atas
//
// JALANKAN:
//   node backend/scripts/e2e-full.js
//   (pastikan environment variable SEED_ADMIN_PASSWORD, SEED_GURU_PASSWORD,
//    dan SEED_KEPSK_PASSWORD sudah di-set sebelum menjalankan)
// =============================================================================
const BASE = 'http://localhost:3000';
const request = (options) => new Promise((resolve, reject) => {
  const http = require('http');
  const req = http.request(options, (res) => {
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
  console.log('=== LOGIN TEST (SEED CREDENTIALS) ===\n');

  // Credential dari environment variable (TIDAK HARDCODE)
  // Email adalah dummy/seed account untuk testing
  const credentials = [
    { email: 'admin@contoh.sch.id', password: process.env.SEED_ADMIN_PASSWORD, label: 'SUPER_ADMIN' },
    { email: 'guru@contoh.sch.id', password: process.env.SEED_GURU_PASSWORD, label: 'GURU' },
    { email: 'kepsek@contoh.sch.id', password: process.env.SEED_KEPSK_PASSWORD, label: 'KEPALA_SEKOLAH' },
  ];

  const tokens = {};
  for (const cred of credentials) {
    const res = await request({
      hostname: 'localhost', port: 3000, path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cred.email, password: cred.password })
    });
    console.log(`[${cred.label}] ${cred.email}:`);
    console.log(`  Status: ${res.status}`);
    console.log(`  Body: ${JSON.stringify(res.body)}`);
    if (res.status === 200 || res.status === 201) {
      const cookies = res.headers['set-cookie'];
      tokens[cred.label] = cookies;
      console.log(`  Cookies: ${cookies ? cookies.join('; ').substring(0, 100) + '...' : 'NONE'}`);
    } else {
      console.log(`  FAILED - no cookie obtained`);
      tokens[cred.label] = null;
    }
    console.log('');
  }

  // Helper with cookie
  const authReq = async (path, method = 'GET', body = null, cookieArray) => {
    const opts = {
      hostname: 'localhost', port: 3000, path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (cookieArray) {
      const cookieStr = cookieArray.join('; ');
      opts.headers['Cookie'] = cookieStr;
    }
    if (body) opts.body = JSON.stringify(body);
    return request(opts);
  };

  const adminCookie = tokens['SUPER_ADMIN'];
  const guruCookie = tokens['GURU'];
  const kepalaCookie = tokens['KEPALA_SEKOLAH'];

  if (!adminCookie) { console.log('ERROR: SUPER_ADMIN login failed, abort E2E'); process.exit(1); }
  if (!guruCookie) { console.log('WARN: GURU login failed, RBAC tests limited'); }
  if (!kepalaCookie) { console.log('WARN: KEPALA_SEKOLAH login failed, RBAC tests limited'); }

  console.log('=== ACADEMIC PERIOD TEST ===\n');

  // Get academic periods
  const periodsRes = await authReq('/api/academic-periods', 'GET', null, adminCookie);
  console.log('[1] GET /api/academic-periods (SUPER_ADMIN):', periodsRes.status);
  const periods = periodsRes.body || [];
  console.log(`  Count: ${periods.length}`);
  const periodId = periods[0]?.id;
  if (periods.length > 0) {
    console.log(`  First period: ${JSON.stringify(periods[0])}`);
  } else {
    console.log('  WARNING: No academic periods found');
  }
  console.log('');

  console.log('=== CRITERIA TEST ===\n');

  // Get criteria
  const criteriaRes = await authReq('/api/criteria', 'GET', null, adminCookie);
  console.log('[2] GET /api/criteria (SUPER_ADMIN):', criteriaRes.status);
  const criteria = criteriaRes.body || [];
  console.log(`  Count: ${criteria.length}`);
  const activeCriteria = criteria.filter(c => c.is_active === true);
  console.log(`  Active: ${activeCriteria.length}`);
  activeCriteria.forEach(c => console.log(`    - ${c.code}: ${c.name} (${c.type})`));
  console.log('');

  console.log('=== AHP COMPARISONS TEST ===\n');

  // GET /api/ahp/comparisons mengembalikan placeholder (belum diimplementasi lengkap)
  const compsPlaceholderRes = await authReq('/api/ahp/comparisons', 'GET', null, adminCookie);
  console.log('[3] GET /api/ahp/comparisons (SUPER_ADMIN) - placeholder:', compsPlaceholderRes.status);
  console.log(`  Response: ${JSON.stringify(compsPlaceholderRes.body)}`);
  console.log('');

  // Gunakan endpoint matrix untuk melihat matriks perbandingan
  console.log('[INFO] Mengecek matriks perbandingan AHP...');
  const matrixRes = await authReq('/api/ahp/comparisons/matrix', 'GET', null, adminCookie);
  console.log('[3b] GET /api/ahp/comparisons/matrix (tanpa academic_period_id):', matrixRes.status);
  if (matrixRes.status === 400) {
    console.log(`  Expected: ${JSON.stringify(matrixRes.body)} (harus beri academic_period_id)`);
  }
  console.log('');

  console.log('=== AHP CALCULATE TEST ===\n');

  // Ambil criteria IDs untuk membuat perbandingan
  const criteriaIds = activeCriteria.map(c => ({ code: c.code, id: c.id }));
  console.log(`[INFO] Akan membuat perbandingan untuk ${criteriaIds.length} kriteria`);

  // Buat semua pairwise comparisons untuk N kriteria (N*(N-1) comparisons)
  let createdCount = 0;
  for (let i = 0; i < criteriaIds.length; i++) {
    for (let j = 0; j < criteriaIds.length; j++) {
      if (i === j) continue;
      // Cek apakah sudah ada comparison untuk pasangan ini
      const existing = await authReq('/api/ahp/comparisons/matrix', 'GET', null, adminCookie);
      // Kita akan buat semua comparison dengan nilai konsisten
      // Gunakan nilai yang menghasilkan bobot masuk akal
    }
  }

  // Buat perbandingan dengan nilai yang konsisten (contoh: C1 lebih penting dari C2, dst.)
  // Untuk N=4, kita butuh 12 comparisons (6 pasangan unik × 2 arah)
  const comparisonPairs = [];
  for (let i = 0; i < criteriaIds.length; i++) {
    for (let j = i + 1; j < criteriaIds.length; j++) {
      // Tentukan nilai perbandingan berdasarkan prioritas: C1 > C2 > C3 > C4
      // C1 (Pengetahuan) paling penting, C4 (Ekstrakurikuler) least
      const priorityDiff = j - i; // 1, 2, 3
      const value = priorityDiff === 1 ? 3 : (priorityDiff === 2 ? 5 : 7);
      comparisonPairs.push({
        i: criteriaIds[i].id,
        j: criteriaIds[j].id,
        value: value
      });
    }
  }

  console.log(`[INFO] Membuat ${comparisonPairs.length} perbandingan pairwise...`);
  for (const pair of comparisonPairs) {
    const createRes = await authReq('/api/ahp/comparisons', 'POST', {
      academic_period_id: periodId,
      criteria_i_id: pair.i,
      criteria_j_id: pair.j,
      comparison_value: pair.value
    }, adminCookie);
    if (createRes.status === 200 || createRes.status === 201) {
      createdCount++;
      console.log(`  [+] Created: ${criteriaIds.find(c => c.id === pair.i).code} vs ${criteriaIds.find(c => c.id === pair.j).code} = ${pair.value}`);
    } else {
      console.log(`  [!] Gagal: ${criteriaIds.find(c => c.id === pair.i).code} vs ${criteriaIds.find(c => c.id === pair.j).code}: ${JSON.stringify(createRes.body)}`);
    }
  }
  console.log(`  Total dibuat: ${createdCount}/${comparisonPairs.length}`);
  console.log('');

  // Verifikasi dengan matrix endpoint
  console.log('[INFO] Memverifikasi matriks perbandingan...');
  const matrixVerifyRes = await authReq('/api/ahp/comparisons/matrix', 'GET', null, adminCookie);
  console.log('[3c] GET /api/ahp/comparisons/matrix (tanpa parameter):', matrixVerifyRes.status);
  if (matrixVerifyRes.status === 400) {
    const matrixWithParam = await authReq(`/api/ahp/comparisons/matrix?academic_period_id=${periodId}`, 'GET', null, adminCookie);
    console.log('[3d] GET /api/ahp/comparisons/matrix?academic_period_id=...:', matrixWithParam.status);
    console.log(`  Matrix: ${JSON.stringify(matrixWithParam.body)}`);
    if (matrixWithParam.body && matrixWithParam.body.matrix) {
      console.log(`  Matrix size: ${matrixWithParam.body.n}×${matrixWithParam.body.n}`);
      console.log(`  Comparisons count: ${matrixWithParam.body.comparisons_count}`);
    }
  }
  console.log('');

  // AHP Calculate
  const ahpCalcRes = await authReq('/api/ahp/calculate', 'POST', {
    academic_period_id: periodId
  }, adminCookie);
  console.log('[4] POST /api/ahp/calculate (SUPER_ADMIN):', ahpCalcRes.status);
  console.log(`  Response: ${JSON.stringify(ahpCalcRes.body, null, 2)}`);
  
  if (ahpCalcRes.status === 200 || ahpCalcRes.status === 201) {
    const ahpResult = ahpCalcRes.body;
    const ahpId = ahpResult.id;
    
    console.log('\n[5] AHP RESULT VERIFICATION:');
    console.log(`  ID: ${ahpId}`);
    console.log(`  λmax: ${ahpResult.lambda_max}`);
    console.log(`  CI: ${ahpResult.ci}`);
    console.log(`  CR: ${ahpResult.cr}`);
    console.log(`  RI: ${ahpResult.ri}`);
    console.log(`  is_valid: ${ahpResult.is_valid}`);
    console.log(`  N: ${ahpResult.n}`);
    console.log(`  Weight vector:`);
    const wv = ahpResult.weight_vector || {};
    const wvSum = Object.values(wv).reduce((a, b) => a + b, 0);
    for (const [code, weight] of Object.entries(wv)) {
      console.log(`    ${code}: ${weight} (sum check: ${wvSum.toFixed(4)})`);
    }
    console.log(`  Weight sum: ${wvSum.toFixed(4)} (should be ~1.0)`);
    console.log('');
    
    console.log('=== AHP CALCULATIONS LIST (READBACK) ===\n');
    
    // Get AHP calculations
    const ahpCalcsRes = await authReq('/api/ahp/calculations', 'GET', null, adminCookie);
    console.log('[6] GET /api/ahp/calculations (SUPER_ADMIN):', ahpCalcsRes.status);
    console.log(`  Count: ${ahpCalcsRes.body?.length || 0}`);
    ahpCalcsRes.body?.forEach(c => {
      console.log(`    - ID: ${c.id}`);
      console.log(`      λmax: ${c.lambda_max}, CI: ${c.ci}, CR: ${c.cr}, RI: ${c.ri}`);
      console.log(`      is_valid: ${c.is_valid}`);
      console.log(`      weight_vector: ${JSON.stringify(c.weight_vector)}`);
    });
    console.log('');
    
    console.log('=== AHP CALCULATION DETAIL (READBACK) ===\n');
    
    // Get specific AHP calculation
    const ahpDetailRes = await authReq(`/api/ahp/calculations/${ahpId}`, 'GET', null, adminCookie);
    console.log('[7] GET /api/ahp/calculations/${ahpId} (SUPER_ADMIN):', ahpDetailRes.status);
    console.log(`  ${JSON.stringify(ahpDetailRes.body, null, 2)}`);
    console.log('');
    
    console.log('=== TOPSIS CALCULATE TEST ===\n');
    
    // TOPSIS Calculate
    const topsisCalcRes = await authReq('/api/topsis/calculate', 'POST', {
      academic_period_id: periodId,
      ahp_calculation_id: ahpId
    }, adminCookie);
    console.log('[8] POST /api/topsis/calculate (SUPER_ADMIN):', topsisCalcRes.status);
    console.log(`  Response: ${JSON.stringify(topsisCalcRes.body, null, 2)}`);
    
    if (topsisCalcRes.status === 200 || topsisCalcRes.status === 201) {
      const topsisResult = topsisCalcRes.body;
      const topId = topsisResult.id;
      
      console.log('\n[9] TOPSIS RESULT VERIFICATION:');
      console.log(`  ID: ${topId}`);
      console.log(`  M (siswa terlibat): ${topsisResult.summary?.M}`);
      console.log(`  N (kriteria): ${topsisResult.summary?.N}`);
      console.log(`  Siswa excluded: ${topsisResult.summary?.siswa_excluded_missing}`);
      console.log(`  List excluded: ${topsisResult.summary?.list_siswa_excluded?.join(', ') || 'none'}`);
      console.log(`  Ranking:`);
      (topsisResult.ranking || []).forEach(r => {
        console.log(`    - ${r.student_code}: rank ${r.rank}, Vi = ${r.nilai_preferensi}`);
      });
      console.log('');
      
      console.log('=== TOPSIS RANKING (READBACK) ===\n');
      
      // Get TOPSIS ranking
      const rankingRes = await authReq('/api/topsis/ranking', 'GET', null, adminCookie);
      console.log('[10] GET /api/topsis/ranking (SUPER_ADMIN):', rankingRes.status);
      console.log(`  Count: ${rankingRes.body?.length || 0}`);
      rankingRes.body?.forEach(c => {
        console.log(`    - ID: ${c.id}, M: ${c.rank ? Object.keys(c.rank).length : 0}`);
        if (c.rank) {
          console.log(`      Rank: ${JSON.stringify(c.rank)}`);
        }
        if (c.preference_value) {
          console.log(`      Preference: ${JSON.stringify(c.preference_value)}`);
        }
      });
      console.log('');
      
      console.log('=== TOPSIS CALCULATION DETAIL (READBACK) ===\n');
      
      // Get specific TOPSIS calculation
      const topDetailRes = await authReq(`/api/topsis/calculations/${topId}`, 'GET', null, adminCookie);
      console.log('[11] GET /api/topsis/calculations/${topId} (SUPER_ADMIN):', topDetailRes.status);
      console.log(`  ${JSON.stringify(topDetailRes.body, null, 2)}`);
      console.log('');
      
      console.log('=== RBAC TESTS ===\n');
      
      console.log('[12] GURU RBAC TESTS:');
      
      // GURU try AHP calculate (should 403)
      if (guruCookie) {
        const guruAHP = await authReq('/api/ahp/calculate', 'POST', {
          academic_period_id: periodId
        }, guruCookie);
        console.log(`  GURU POST /api/ahp/calculate: ${guruAHP.status} (expect 403)`);
        console.log(`    ${JSON.stringify(guruAHP.body)}`);
      }
      
      // GURU try TOPSIS calculate (should 403)
      if (guruCookie && ahpId) {
        const guruTOPSIS = await authReq('/api/topsis/calculate', 'POST', {
          academic_period_id: periodId,
          ahp_calculation_id: ahpId
        }, guruCookie);
        console.log(`  GURU POST /api/topsis/calculate: ${guruTOPSIS.status} (expect 403)`);
        console.log(`    ${JSON.stringify(guruTOPSIS.body)}`);
      }
      
      console.log('');
      console.log('[13] KEPALA_SEKOLAH RBAC TESTS:');
      
      // KEPALA_SEKOLAH read AHP calculations (should 200)
      if (kepalaCookie) {
        const kepalaAHP = await authReq('/api/ahp/calculations', 'GET', null, kepalaCookie);
        console.log(`  KEPALA GET /api/ahp/calculations: ${kepalaAHP.status} (expect 200)`);
        console.log(`    Count: ${kepalaAHP.body?.length || 0}`);
      }
      
      // KEPALA_SEKOLAH read AHP calculation detail (should 200)
      if (kepalaCookie && ahpId) {
        const kepalaAHPDetail = await authReq(`/api/ahp/calculations/${ahpId}`, 'GET', null, kepalaCookie);
        console.log(`  KEPALA GET /api/ahp/calculations/${ahpId}: ${kepalaAHPDetail.status} (expect 200)`);
        console.log(`    ${JSON.stringify(kepalaAHPDetail.body)}`);
      }
      
      // KEPALA_SEKOLAH read TOPSIS ranking (should 200)
      if (kepalaCookie) {
        const kepalaTOPSIS = await authReq('/api/topsis/ranking', 'GET', null, kepalaCookie);
        console.log(`  KEPALA GET /api/topsis/ranking: ${kepalaTOPSIS.status} (expect 200)`);
        console.log(`    Count: ${kepalaTOPSIS.body?.length || 0}`);
      }
      
      // KEPALA_SEKOLAH read TOPSIS calculation detail (should 200)
      if (kepalaCookie && topId) {
        const kepalaTopDetail = await authReq(`/api/topsis/calculations/${topId}`, 'GET', null, kepalaCookie);
        console.log(`  KEPALA GET /api/topsis/calculations/${topId}: ${kepalaTopDetail.status} (expect 200)`);
        console.log(`    ${JSON.stringify(kepalaTopDetail.body)}`);
      }
      
      console.log('');
      console.log('=== E2E VALIDATION COMPLETE ===');
    }
  } else {
    console.log('AHP calculate failed, cannot proceed with TOPSIS test');
  }
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
