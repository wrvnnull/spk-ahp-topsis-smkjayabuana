import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAcademicPeriodDto, SemesterEnum } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

@Injectable()
export class AcademicPeriodService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAcademicPeriodDto) {
    const data: any = {
      name: dto.name,
      school_year: dto.school_year,
      semester: dto.semester,
      is_active: dto.is_active ?? false,
    };

    const academicPeriod = await this.prisma.academicPeriod.create({ data });

    return this.toResponse(academicPeriod);
  }

  async findAll() {
    const academicPeriods = await this.prisma.academicPeriod.findMany({
      orderBy: { created_at: 'desc' },
    });

    return academicPeriods.map((ap) => this.toResponse(ap));
  }

  async findOne(id: string) {
    const academicPeriod = await this.prisma.academicPeriod.findUnique({
      where: { id },
    });

    if (!academicPeriod) {
      throw new NotFoundException(`AcademicPeriod dengan ID ${id} tidak ditemukan`);
    }

    return this.toResponse(academicPeriod);
  }

  async update(id: string, dto: UpdateAcademicPeriodDto) {
    const existing = await this.prisma.academicPeriod.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`AcademicPeriod dengan ID ${id} tidak ditemukan`);
    }

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.school_year !== undefined) data.school_year = dto.school_year;
    if (dto.semester !== undefined) data.semester = dto.semester;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;

    const updated = await this.prisma.academicPeriod.update({
      where: { id },
      data,
    });

    return this.toResponse(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.academicPeriod.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`AcademicPeriod dengan ID ${id} tidak ditemukan`);
    }

    await this.prisma.academicPeriod.delete({ where: { id } });

    return { message: `AcademicPeriod dengan ID ${id} berhasil dihapus` };
  }

  async setActive(id: string) {
    const existing = await this.prisma.academicPeriod.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`AcademicPeriod dengan ID ${id} tidak ditemukan`);
    }

    // Set semua yang lain non-aktif
    await this.prisma.academicPeriod.updateMany({
      where: { NOT: { id } },
      data: { is_active: false },
    });

    // Set yang dipilih aktif
    const updated = await this.prisma.academicPeriod.update({
      where: { id },
      data: { is_active: true },
    });

    return this.toResponse(updated);
  }

  private toResponse(ap: any) {
    const { id, name, school_year, semester, is_active, created_at } = ap;
    return { id, name, school_year, semester, is_active, created_at };
  }
}
