import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { BulkScoresDto } from './dto/bulk-scores.dto';

@Injectable()
export class ScoreService {
  private readonly logger = new Logger(ScoreService.name);

  constructor(private prisma: PrismaService) {}

  async findByUserId(user: { userId: string; role: string; ownedClassIds: string[] }) {
    const { role, ownedClassIds } = user;

    if (role === 'SUPER_ADMIN' || role === 'KEPALA_SEKOLAH') {
      return this.prisma.score.findMany({
        include: {
          student: { select: { id: true, name: true, class_id: true } },
          criteria: { select: { id: true, code: true, name: true } },
          academicPeriod: { select: { id: true, name: true, school_year: true, semester: true } },
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
      });
    }

    if (role === 'GURU') {
      const studentIds = await this.prisma.student.findMany({
        where: { class_id: { in: ownedClassIds } },
        select: { id: true },
      });

      const ids = studentIds.map((s) => s.id);
      if (ids.length === 0) return [];

      return this.prisma.score.findMany({
        where: { student_id: { in: ids } },
        include: {
          student: { select: { id: true, name: true, class_id: true } },
          criteria: { select: { id: true, code: true, name: true } },
          academicPeriod: { select: { id: true, name: true, school_year: true, semester: true } },
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
      });
    }

    throw new ForbiddenException('Role tidak memiliki akses');
  }

  async findOneById(id: string) {
    const score = await this.prisma.score.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, class_id: true } },
        criteria: { select: { id: true, code: true, name: true } },
        academicPeriod: { select: { id: true, name: true, school_year: true, semester: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    if (!score) throw new ForbiddenException('Score tidak ditemukan');
    return score;
  }

  async validateGuruOwnership(user: { userId: string; role: string; ownedClassIds: string[] }, studentId: string) {
    if (user.role !== 'GURU') return;

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { class_id: true },
    });

    if (!student) throw new ForbiddenException('Siswa tidak ditemukan');
    if (!user.ownedClassIds.includes(student.class_id)) {
      throw new ForbiddenException('Anda tidak memiliki akses ke siswa ini');
    }
  }

  async create(user: { userId: string; role: string; ownedClassIds: string[] }, dto: CreateScoreDto) {
    await this.validateGuruOwnership(user, dto.student_id);

    const isMissing = dto.value === undefined || dto.value === null;
    const value: number = dto.value ?? 0;

    try {
      const score = await this.prisma.score.upsert({
        where: {
          student_id_criteria_id_academic_period_id: {
            student_id: dto.student_id,
            criteria_id: dto.criteria_id,
            academic_period_id: dto.academic_period_id,
          },
        },
        update: {
          value,
          is_missing: isMissing || dto.is_missing === true,
          note: dto.note ?? undefined,
        },
        create: {
          student_id: dto.student_id,
          criteria_id: dto.criteria_id,
          academic_period_id: dto.academic_period_id,
          value,
          is_missing: isMissing || dto.is_missing === true,
          note: dto.note ?? undefined,
          created_by: user.userId,
        },
        include: {
          student: { select: { id: true, name: true, class_id: true } },
          criteria: { select: { id: true, code: true, name: true } },
          academicPeriod: { select: { id: true, name: true, school_year: true, semester: true } },
          createdByUser: { select: { id: true, name: true } },
        },
      });

      this.logger.log(`Score upserted: ${score.id} (student=${dto.student_id}, criteria=${dto.criteria_id})`);
      return score;
    } catch (error) {
      this.logger.error(`Gagal create/upsert score: ${error.message}`);
      throw error;
    }
  }

  async update(user: { userId: string; role: string; ownedClassIds: string[] }, dto: UpdateScoreDto) {
    const existing = await this.findOneById(dto.id);

    if (user.role === 'GURU') {
      await this.validateGuruOwnership(user, existing.student_id);
    }

    const updateData: Record<string, unknown> = {};

    if (dto.value !== undefined) {
      updateData.value = dto.value;
      if (dto.value === null || dto.value === undefined) {
        updateData.is_missing = true;
      }
    }

    if (dto.is_missing !== undefined) {
      updateData.is_missing = dto.is_missing;
    }

    if (dto.note !== undefined) {
      updateData.note = dto.note;
    }

    const score = await this.prisma.score.update({
      where: { id: dto.id },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, class_id: true } },
        criteria: { select: { id: true, code: true, name: true } },
        academicPeriod: { select: { id: true, name: true, school_year: true, semester: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    return score;
  }

  async bulkCreate(user: { userId: string; role: string; ownedClassIds: string[] }, dto: BulkScoresDto) {
    const results: Array<{ index: number; success: boolean; data?: Record<string, unknown>; error?: string }> = [];

    for (let i = 0; i < dto.scores.length; i++) {
      const item = dto.scores[i];
      try {
        await this.validateGuruOwnership(user, item.student_id);

        const isMissing = item.value === undefined || item.value === null;
        const value: number = item.value ?? 0;

        const score = await this.prisma.score.upsert({
          where: {
            student_id_criteria_id_academic_period_id: {
              student_id: item.student_id,
              criteria_id: item.criteria_id,
              academic_period_id: item.academic_period_id,
            },
          },
          update: {
            value,
            is_missing: isMissing || item.is_missing === true,
            note: item.note ?? undefined,
          },
          create: {
            student_id: item.student_id,
            criteria_id: item.criteria_id,
            academic_period_id: item.academic_period_id,
            value,
            is_missing: isMissing || item.is_missing === true,
            note: item.note ?? undefined,
            created_by: user.userId,
          },
          include: {
            student: { select: { id: true, name: true, class_id: true } },
            criteria: { select: { id: true, code: true, name: true } },
            academicPeriod: { select: { id: true, name: true, school_year: true, semester: true } },
            createdByUser: { select: { id: true, name: true } },
          },
        });

        results.push({ index: i, success: true, data: this.sanitizeScore(score) });
      } catch (error) {
        this.logger.error(`Bulk index ${i} gagal: ${error.message}`);
        results.push({ index: i, success: false, error: error.message });
      }
    }

    return results;
  }

  async remove(user: { userId: string; role: string; ownedClassIds: string[] }, id: string) {
    const existing = await this.findOneById(id);

    if (user.role === 'GURU') {
      await this.validateGuruOwnership(user, existing.student_id);
    }

    return this.prisma.score.delete({
      where: { id },
    });
  }

  private sanitizeScore(score: Record<string, unknown>): Record<string, unknown> {
    return {
      id: score.id,
      student_id: score.student_id,
      criteria_id: score.criteria_id,
      academic_period_id: score.academic_period_id,
      value: score.value,
      is_missing: score.is_missing,
      note: score.note,
      created_by: score.created_by,
      created_at: score.created_at,
      updated_at: score.updated_at,
      student: score.student,
      criteria: score.criteria,
      academicPeriod: score.academicPeriod,
      createdByUser: score.createdByUser,
    };
  }
}
