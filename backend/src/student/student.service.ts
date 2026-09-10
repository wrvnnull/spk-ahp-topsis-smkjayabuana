import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(req: AuthenticatedRequest) {
    const where: any = {};
    const ownedClassIds = req.user?.ownedClassIds ?? [];

    if (req.user?.role === 'GURU') {
      if (ownedClassIds.length === 0) {
        return [];
      }
      where.class_id = { in: ownedClassIds };
    }

    return this.prisma.student.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academic_period_id: true,
            wali_teacher_id: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, req: AuthenticatedRequest) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academic_period_id: true,
            wali_teacher_id: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    if (req.user?.role === 'GURU') {
      const ownedIds = req.user.ownedClassIds ?? [];
      if (!ownedIds.includes(student.class_id)) {
        throw new ForbiddenException(
          'Anda tidak memiliki akses ke siswa ini',
        );
      }
    }

    return student;
  }

  async create(dto: CreateStudentDto, req: AuthenticatedRequest) {
    const role = req.user?.role;

    if (role !== 'SUPER_ADMIN' && role !== 'GURU') {
      throw new ForbiddenException(
        'Hanya SUPER_ADMIN dan GURU yang dapat menambahkan siswa',
      );
    }

    if (role === 'GURU') {
      if (!req.user!.ownedClassIds.includes(dto.class_id)) {
        throw new ForbiddenException(
          'Anda hanya dapat menambahkan siswa ke kelas yang Anda wali',
        );
      }
    }

    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id: dto.class_id },
    });

    if (!classRoom) {
      throw new BadRequestException('Kelas tidak ditemukan');
    }

    if (dto.student_code) {
      const existing = await this.prisma.student.findFirst({
        where: {
          class_id: dto.class_id,
          student_code: dto.student_code,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Kode siswa "${dto.student_code}" sudah digunakan di kelas ini`,
        );
      }
    }

    const student = await this.prisma.student.create({
      data: {
        class_id: dto.class_id,
        student_code: dto.student_code ?? null,
        name: dto.name,
        is_active: dto.is_active ?? true,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academic_period_id: true,
            wali_teacher_id: true,
          },
        },
      },
    });

    return student;
  }

  async update(id: string, dto: UpdateStudentDto, req: AuthenticatedRequest) {
    const role = req.user?.role;

    if (role !== 'SUPER_ADMIN' && role !== 'GURU') {
      throw new ForbiddenException(
        'Hanya SUPER_ADMIN dan GURU yang dapat mengupdate siswa',
      );
    }

    const existing = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    if (role === 'GURU') {
      if (!req.user!.ownedClassIds.includes(existing.class_id)) {
        throw new ForbiddenException(
          'Anda hanya dapat mengupdate siswa di kelas yang Anda wali',
        );
      }

      if (dto.class_id && dto.class_id !== existing.class_id) {
        if (!req.user!.ownedClassIds.includes(dto.class_id)) {
          throw new ForbiddenException(
            'Anda hanya dapat memindahkan siswa ke kelas yang Anda wali',
          );
        }
      }
    }

    if (dto.student_code && dto.student_code !== existing.student_code) {
      const conflict = await this.prisma.student.findFirst({
        where: {
          class_id: dto.class_id ?? existing.class_id,
          student_code: dto.student_code,
          NOT: { id: id },
        },
      });

      if (conflict) {
        throw new BadRequestException(
          `Kode siswa "${dto.student_code}" sudah digunakan di kelas ini`,
        );
      }
    }

    const updateData: any = {};
    if (dto.class_id !== undefined) updateData.class_id = dto.class_id;
    if (dto.student_code !== undefined)
      updateData.student_code = dto.student_code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const student = await this.prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            academic_period_id: true,
            wali_teacher_id: true,
          },
        },
      },
    });

    return student;
  }

  async getScores(studentId: string, req: AuthenticatedRequest) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { class_id: true },
    });

    if (!student) {
      throw new NotFoundException('Siswa tidak ditemukan');
    }

    if (req.user?.role === 'GURU') {
      if (!req.user.ownedClassIds.includes(student.class_id)) {
        throw new ForbiddenException(
          'Anda tidak memiliki akses ke nilai siswa ini',
        );
      }
    }

    const scores = await this.prisma.score.findMany({
      where: { student_id: studentId },
      include: {
        criteria: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            is_active: true,
          },
        },
        academicPeriod: {
          select: {
            id: true,
            name: true,
            school_year: true,
            semester: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      student_id: studentId,
      scores,
    };
  }
}
