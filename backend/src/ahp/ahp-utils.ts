// AHP calculation utilities — pure functions, no NestJS/Prisma dependencies.
// Digunakan oleh AhpService dan di-test secara terpisah.

import { BadRequestException } from '@nestjs/common';

// Random Index (RI) table from Saaty (1980)
const RANDOM_INDEX: Record<number, number> = {
  1: 0.00,
  2: 0.00,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

/**
 * Mendapatkan Random Index (RI) untuk jumlah kriteria N.
 * Hanya mendukung N = 1..10. Untuk N > 10 harus diimplementasi interpolasi.
 */
export function getRandomIndex(n: number): number {
  if (n < 1 || n > 10) {
    throw new Error(`RI untuk N=${n} belum tersedia (harus diimplementasi interpolasi)`);
  }
  return RANDOM_INDEX[n];
}

/**
 * Normalisasi matriks perbandingan berpasangan.
 * n_ij = a_ij / Σ(a_kj) untuk setiap kolom j.
 */
export function normalizeMatrix(matrix: number[][], n: number): number[][] {
  const normalized: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0),
  );

  for (let j = 0; j < n; j++) {
    let colSum = 0;
    for (let i = 0; i < n; i++) {
      colSum += matrix[i][j];
    }
    if (colSum === 0) {
      throw new BadRequestException(
        `Kolom ${j + 1} memiliki jumlah 0, tidak dapat dinormalisasi`,
      );
    }
    for (let i = 0; i < n; i++) {
      normalized[i][j] = matrix[i][j] / colSum;
    }
  }

  return normalized;
}

/**
 * Menghitung vektor prioritas (bobot) dari matriks ternormalisasi.
 * w_i = (Σ n_ij) / N untuk setiap baris i.
 */
export function calculatePriorityVector(normalized: number[][], n: number): number[] {
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += normalized[i][j];
    }
    weights[i] = rowSum / n;
  }
  return weights;
}

/**
 * Menghitung λ_max (lambda maksimum) dari matriks perbandingan dan bobot.
 * λ_max = (Σ (Σ_i / w_i)) / N, di mana Σ_i = Σ(a_ij × w_j).
 */
export function calculateLambdaMax(
  matrix: number[][],
  weights: number[],
  n: number,
): number {
  // A × w
  const aw: number[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += matrix[i][j] * weights[j];
    }
    aw[i] = sum;
  }

  // λ_max = (Σ (aw_i / w_i)) / N
  let sumLambda = 0;
  for (let i = 0; i < n; i++) {
    if (weights[i] === 0) {
      throw new BadRequestException(
        `Bobot kriteria ${i + 1} adalah 0, tidak dapat menghitung λ_max`,
      );
    }
    sumLambda += aw[i] / weights[i];
  }

  return sumLambda / n;
}

/**
 * Menghitung Consistency Index (CI).
 * CI = (λ_max - N) / (N - 1)
 * Untuk N <= 1, CI = 0.
 */
export function calculateCI(lambdaMax: number, n: number): number {
  if (n <= 1) return 0;
  return (lambdaMax - n) / (n - 1);
}

/**
 * Menghitung Consistency Ratio (CR).
 * CR = CI / RI
 * Mengembalikan null jika CR tidak terdefinisi (N <= 2 atau RI = 0).
 */
export function calculateCR(ci: number, ri: number, n: number): number | null {
  if (n <= 2 || ri === 0) return null;
  return ci / ri;
}
