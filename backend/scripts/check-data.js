// =============================================================================
// CHECK DATA - Diagnostic script untuk melihat sample data dari database
// =============================================================================
// WARNING: Script ini hanya untuk keperluan development/diagnostic.
// TIDAK boleh digunakan terhadap production database.
// Script hanya melakukan READ (SELECT), tidak ada operasi WRITE/UPDATE/DELETE.
// =============================================================================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    const periods = await prisma.$queryRaw`SELECT id, name, school_year, semester, is_active FROM academic_periods ORDER BY created_at DESC LIMIT 5`;
    console.log('ACADEMIC_PERIODS:\n' + JSON.stringify(periods, null, 2));
    const criteria = await prisma.$queryRaw`SELECT id, code, name, type, is_active FROM criteria ORDER BY code`;
    console.log('\nCRITERIA:\n' + JSON.stringify(criteria, null, 2));
    const users = await prisma.$queryRaw`SELECT id, name, role, email FROM users ORDER BY role, email`;
    console.log('\nUSERS:\n' + JSON.stringify(users, null, 2));
    const classes = await prisma.$queryRaw`SELECT id, name, wali_teacher_id FROM classes ORDER BY name`;
    console.log('\nCLASSES:\n' + JSON.stringify(classes, null, 2));
    const students = await prisma.$queryRaw`SELECT id, class_id, student_code, name, is_active FROM students ORDER BY class_id, student_code`;
    console.log('\nSTUDENTS:\n' + JSON.stringify(students, null, 2));
    const scores = await prisma.$queryRaw`SELECT id, student_id, criteria_id, value, is_missing FROM scores ORDER BY student_id, criteria_id LIMIT 20`;
    console.log('\nSCORES (sample 20):\n' + JSON.stringify(scores, null, 2));
    const comps = await prisma.$queryRaw`SELECT id, criteria_i_id, criteria_j_id, comparison_value FROM ahp_comparisons ORDER BY criteria_i_id, criteria_j_id LIMIT 20`;
    console.log('\nAHP_COMPARISONS (sample 20):\n' + JSON.stringify(comps, null, 2));
    const ahpcalcs = await prisma.$queryRaw`SELECT id, academic_period_id, ci, cr, ri, is_valid FROM ahp_calculations ORDER BY calculated_at DESC LIMIT 5`;
    console.log('\nAHP_CALCULATIONS:\n' + JSON.stringify(ahpcalcs, null, 2));
    const topisss = await prisma.$queryRaw`SELECT id, academic_period_id, ahp_calculation_id, calculated_at FROM topsis_calculations ORDER BY calculated_at DESC LIMIT 5`;
    console.log('\nTOPSIS_CALCULATIONS:\n' + JSON.stringify(topisss, null, 2));
    await prisma.$disconnect();
    console.log('\n[DONE]');
  } catch (e) {
    console.error('DB ERROR:', e.message);
    await prisma.$disconnect();
  }
}
main();
