import { BadRequestException } from '@nestjs/common';
import {
  getRandomIndex,
  normalizeMatrix,
  calculatePriorityVector,
  calculateLambdaMax,
  calculateCI,
  calculateCR,
} from './ahp-utils';

describe('AHP Utils — getRandomIndex', () => {
  it('should return correct RI values (Saaty 1980)', () => {
    expect(getRandomIndex(1)).toBe(0.00);
    expect(getRandomIndex(2)).toBe(0.00);
    expect(getRandomIndex(3)).toBe(0.58);
    expect(getRandomIndex(4)).toBe(0.90);
    expect(getRandomIndex(5)).toBe(1.12);
    expect(getRandomIndex(6)).toBe(1.24);
    expect(getRandomIndex(7)).toBe(1.32);
    expect(getRandomIndex(8)).toBe(1.41);
    expect(getRandomIndex(9)).toBe(1.45);
    expect(getRandomIndex(10)).toBe(1.49);
  });

  it('should throw error for N < 1', () => {
    expect(() => getRandomIndex(0)).toThrow(
      'RI untuk N=0 belum tersedia',
    );
    expect(() => getRandomIndex(-1)).toThrow(
      'RI untuk N=-1 belum tersedia',
    );
  });

  it('should throw error for N > 10', () => {
    expect(() => getRandomIndex(11)).toThrow(
      'RI untuk N=11 belum tersedia',
    );
  });
});

describe('AHP Utils — normalizeMatrix', () => {
  it('should normalize a 3x3 matrix correctly', () => {
    const matrix = [
      [1, 3, 5],
      [1/3, 1, 2],
      [1/5, 1/2, 1],
    ];
    const result = normalizeMatrix(matrix, 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(3);
    expect(result[1]).toHaveLength(3);
    expect(result[2]).toHaveLength(3);

    // Column 0: [1, 1/3, 1/5] -> sum = 1 + 0.333 + 0.2 = 1.5333...
    const colSum0 = 1 + 1/3 + 1/5;
    expect(result[0][0]).toBeCloseTo(1 / colSum0, 3);
    expect(result[1][0]).toBeCloseTo((1/3) / colSum0, 3);
    expect(result[2][0]).toBeCloseTo((1/5) / colSum0, 3);

    // Column 1: [3, 1, 1/2] -> sum = 3 + 1 + 0.5 = 4.5
    expect(result[0][1]).toBeCloseTo(3 / 4.5, 3);
    expect(result[1][1]).toBeCloseTo(1 / 4.5, 3);
    expect(result[2][1]).toBeCloseTo(0.5 / 4.5, 3);

    // Column 2: [5, 2, 1] -> sum = 8
    expect(result[0][2]).toBeCloseTo(5 / 8, 3);
    expect(result[1][2]).toBeCloseTo(2 / 8, 3);
    expect(result[2][2]).toBeCloseTo(1 / 8, 3);
  });

  it('should normalize a 2x2 matrix', () => {
    const matrix = [
      [1, 4],
      [0.25, 1],
    ];
    const result = normalizeMatrix(matrix, 2);

    expect(result[0][0]).toBeCloseTo(1 / 1.25, 3);
    expect(result[1][0]).toBeCloseTo(0.25 / 1.25, 3);
    expect(result[0][1]).toBeCloseTo(4 / 5, 3);
    expect(result[1][1]).toBeCloseTo(1 / 5, 3);
  });

  it('should throw if column sum is 0', () => {
    const matrix = [[0, 0], [0, 0]];
    expect(() => normalizeMatrix(matrix, 2)).toThrow('Kolom 1 memiliki jumlah 0');
  });
});

describe('AHP Utils — calculatePriorityVector', () => {
  it('should calculate priority vector (row averages) correctly', () => {
    const normalized = [
      [0.6, 0.5, 0.4],
      [0.2, 0.2, 0.2],
      [0.2, 0.3, 0.4],
    ];
    const weights = calculatePriorityVector(normalized, 3);

    expect(weights[0]).toBeCloseTo((0.6 + 0.5 + 0.4) / 3, 4);
    expect(weights[1]).toBeCloseTo((0.2 + 0.2 + 0.2) / 3, 4);
    expect(weights[2]).toBeCloseTo((0.2 + 0.3 + 0.4) / 3, 4);

    const sum = weights.reduce((a: number, b: number) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
  });
});

describe('AHP Utils — calculateLambdaMax', () => {
  it('should return N for a perfectly consistent matrix', () => {
    const w = [0.5, 0.3, 0.2];
    const matrix = [
      [1, w[0]/w[1], w[0]/w[2]],
      [w[1]/w[0], 1, w[1]/w[2]],
      [w[2]/w[0], w[2]/w[1], 1],
    ];
    const lambdaMax = calculateLambdaMax(matrix, w, 3);
    expect(lambdaMax).toBeCloseTo(3.0, 5);
  });

  it('should return > N for inconsistent matrix', () => {
    const matrix = [
      [1, 3, 5],
      [1/3, 1, 2],
      [1/5, 1/2, 1],
    ];
    const normalized = normalizeMatrix(matrix, 3);
    const weights = calculatePriorityVector(normalized, 3);
    const lambdaMax = calculateLambdaMax(matrix, weights, 3);

    expect(lambdaMax).toBeGreaterThan(3.0);
  });

  it('should throw when weight is 0', () => {
    const matrix = [[1, 2], [0.5, 1]];
    expect(() => calculateLambdaMax(matrix, [0, 1], 2)).toThrow('Bobot kriteria 1 adalah 0');
  });
});

describe('AHP Utils — calculateCI', () => {
  it('should return 0 for perfectly consistent (λ_max = N)', () => {
    expect(calculateCI(3.0, 3)).toBe(0);
    expect(calculateCI(4.0, 4)).toBe(0);
  });

  it('should calculate CI correctly', () => {
    expect(calculateCI(3.05, 3)).toBeCloseTo(0.025, 5);
    expect(calculateCI(5.2, 5)).toBeCloseTo(0.05, 5);
    expect(calculateCI(10, 4)).toBe(2.0);
  });

  it('should return 0 for N <= 1', () => {
    expect(calculateCI(1.0, 1)).toBe(0);
    expect(calculateCI(0.5, 0)).toBe(0);
  });
});

describe('AHP Utils — calculateCR', () => {
  it('should return null for N <= 2 (RI = 0)', () => {
    expect(calculateCR(0.05, 0.00, 1)).toBeNull();
    expect(calculateCR(0.05, 0.00, 2)).toBeNull();
  });

  it('should calculate CR = CI / RI for N > 2', () => {
    const cr = calculateCR(0.029, 0.58, 3);
    expect(cr).toBeCloseTo(0.05, 3);

    const cr2 = calculateCR(0.09, 0.90, 4);
    expect(cr2).toBeCloseTo(0.1, 3);
  });

  it('should return null when RI is 0', () => {
    expect(calculateCR(0.01, 0, 3)).toBeNull();
  });
});

describe('AHP Utils — End-to-end AHP calculation', () => {
  it('should complete full AHP for N=3 with consistent matrix', () => {
    const matrix = [
      [1, 3, 5],
      [1/3, 1, 5/3],
      [1/5, 3/5, 1],
    ];
    const n = 3;

    const normalized = normalizeMatrix(matrix, n);
    const weights = calculatePriorityVector(normalized, n);
    const lambdaMax = calculateLambdaMax(matrix, weights, n);
    const ci = calculateCI(lambdaMax, n);
    const ri = getRandomIndex(n);
    const cr = calculateCR(ci, ri, n);

    expect(lambdaMax).toBeCloseTo(3.0, 5);
    expect(ci).toBe(0);
    expect(cr).toBe(0);

    const sum = weights.reduce((a: number, b: number) => a + b, 0);
    expect(sum).toBeCloseTo(1, 4);

    expect(weights[0]).toBeGreaterThan(weights[1]);
    expect(weights[1]).toBeGreaterThan(weights[2]);
  });

  it('should detect inconsistency when CR > 0.10', () => {
    const matrix = [
      [1, 3, 5],
      [1/3, 1, 8],
      [1/5, 1/8, 1],
    ];
    const normalized = normalizeMatrix(matrix, 3);
    const weights = calculatePriorityVector(normalized, 3);
    const lambdaMax = calculateLambdaMax(matrix, weights, 3);
    const ci = calculateCI(lambdaMax, 3);
    const ri = getRandomIndex(3);
    const cr = calculateCR(ci, ri, 3);

    expect(cr).toBeGreaterThan(0.10);
    expect(ci).toBeGreaterThan(0);
  });
});
