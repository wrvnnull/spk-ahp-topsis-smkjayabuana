import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';

@Injectable()
export class ClassRoomService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClassRoomDto, userRole: string) {
    // Hanya SUPER_ADMIN yang bisa create
    if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Hanya SUPER_ADMIN yang bisa membuat kelas');
    }

    // Validasi academic_period_id ada
    const academicPeriod = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academic_period_id },
    });

    if (!academicPeriod) {
      throw new BadRequestException(
        `AcademicPeriod dengan ID ${dto.academic_period_id} tidak ditemukan`,
      );
    }

    // Validasi wali_teacher_id ada dan role-nya GURU
    const waliTeacher = await this.prisma.user.findUnique({
      where: { id: dto.wali_teacher_id },
    });

    if (!waliTeacher) {
      throw new BadRequestException(
        `User dengan ID ${dto.wali_teacher_id} tidak ditemukan`,
      );
    }

    if (waliTeacher.role !== 'GURU') {
      throw new BadRequestException(
        `User dengan ID ${dto.wali_teacher_id} bukan guru (role: ${waliTeacher.role})`,
      );
    }

    const classRoom = await this.prisma.classRoom.create({
      data: {
        name: dto.name,
        academic_period_id: dto.academic_period_id,
        wali_teacher_id: dto.wali_teacher_id,
      },
      include: {
        academicPeriod: true,
        waliTeacher: true,
      },
    });

    return this.toResponse(classRoom);
  }

  async findAll(user: any) {
    // SUPER_ADMIN dan KEPALA_SEKOLAH dapat semua kelas
    // GURU hanya melihat kelas yang menjadi wali
    if (user.role === 'GURU') {
      const classRooms = await this.prisma.classRoom.findMany({
        where: {
          wali_teacher_id: user.userId,
        },
        orderBy: { created_at: 'desc' },
        include: {
          academicPeriod: true,
          waliTeacher: true,
        },
      });
      return classRooms.map((c) => this.toResponse(c));
    }

    // SUPER_ADMIN dan KEPALA_SEKOLAH dapat semua
    const classRooms = await this.prisma.classRoom.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        academicPeriod: true,
        waliTeacher: true,
      },
    });

    return classRooms.map((c) => this.toResponse(c));
  }

  async findOne(id: string, user: any) {
    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id },
      include: {
        academicPeriod: true,
        waliTeacher: true,
      },
    });

    if (!classRoom) {
      throw new NotFoundException(`ClassRoom dengan ID ${id} tidak ditemukan`);
    }

    // GURU hanya bisa melihat kelas yang menjadi wali
    if (user.role === 'GURU' && classRoom.wali_teacher_id !== user.userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke kelas ini',
      );
    }

    return this.toResponse(classRoom);
  }

  async update(id: string, dto: UpdateClassRoomDto, userRole: string) {
    if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Hanya SUPER_ADMIN yang bisa memperbarui kelas');
    }

    const existing = await this.prisma.classRoom.findUnique({
      where: { id },
      include: {
        academicPeriod: true,
        waliTeacher: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`ClassRoom dengan ID ${id} tidak ditemukan`);
    }

    const data: Record<string, any> = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.academic_period_id !== undefined) {
      // Validasi academic_period_id baru ada
      const newAcademicPeriod = await this.prisma.academicPeriod.findUnique({
        where: { id: dto.academic_period_id },
      });
      if (!newAcademicPeriod) {
        throw new BadRequestException(
          `AcademicPeriod dengan ID ${dto.academic_period_id} tidak ditemukan`,
        );
      }
      data.academic_period_id = dto.academic_period_id;
    }

    if (dto.wali_teacher_id !== undefined) {
      // Validasi wali_teacher_id baru ada dan role-nya GURU
      const newWaliTeacher = await this.prisma.user.findUnique({
        where: { id: dto.wali_teacher_id },
      });
      if (!newWaliTeacher) {
        throw new BadRequestException(
          `User dengan ID ${dto.wali_teacher_id} tidak ditemukan`,
        );
      }
      if (newWaliTeacher.role !== 'GURU') {
        throw new BadRequestException(
          `User dengan ID ${dto.wali_teacher_id} bukan guru (role: ${newWaliTeacher.role})`,
        );
      }
      data.wali_teacher_id = dto.wali_teacher_id;
    }

    const updated = await this.prisma.classRoom.update({
      where: { id },
      data,
      include: {
        academicPeriod: true,
        waliTeacher: true,
      },
    });

    return this.toResponse(updated);
  }

  async remove(id: string, userRole: string) {
    if (userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Hanya SUPER_ADMIN yang bisa menghapus kelas');
    }

    const existing = await this.prisma.classRoom.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`ClassRoom dengan ID ${id} tidak ditemukan`);
    }

    await this.prisma.classRoom.delete({ where: { id } });

    return { message: `ClassRoom dengan ID ${id} berhasil dihapus` };
  }

  private toResponse(cr: any) {
    const { id, name, academic_period_id, wali_teacher_id, created_at, updated_at } = cr;
    const academicPeriod = cr.academicPeriod
      ? {
          id: cr.academicPeriod.id,
          name: cr.academicPeriod.name,
          school_year: cr.academicPeriod.school_year,
          semester: cr.academicPeriod.semester,
          is_active: cr.academicPeriod.is_active,
        }
      : null;

    const waliTeacher = cr.waliTeacher
      ? {
          id: cr.waliTeacher.id,
          name: cr.waliTeacher.name,
          email: cr.waliTeacher.email,
          role: cr.waliTeacher.role,
        }
      : null;

    return {
      id,
      name,
      academic_period_id,
      wali_teacher_id,
      academic_period: academicPeriod,
      wali_teacher: waliTeacher,
      created_at,
      updated_at,
    };
  }
}
