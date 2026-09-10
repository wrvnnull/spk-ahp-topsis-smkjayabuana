import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCriteriaDto } from './dto/create-criteria.dto';
import { UpdateCriteriaDto } from './dto/update-criteria.dto';

@Injectable()
export class CriteriaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.criteria.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const criteria = await this.prisma.criteria.findUnique({
      where: { id },
    });

    if (!criteria) {
      throw new NotFoundException('Kriteria tidak ditemukan');
    }

    return criteria;
  }

  async create(dto: CreateCriteriaDto) {
    try {
      const criteria = await this.prisma.criteria.create({
        data: {
          code: dto.code,
          name: dto.name,
          type: dto.type,
          description: dto.description ?? null,
          is_active: dto.is_active ?? true,
        },
      });

      return criteria;
    } catch (error: any) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        throw new BadRequestException(
          `Kode kriteria "${dto.code}" sudah digunakan`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCriteriaDto) {
    const existing = await this.prisma.criteria.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Kriteria tidak ditemukan');
    }

    const updateData: any = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined)
      updateData.description = dto.description;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    try {
      const criteria = await this.prisma.criteria.update({
        where: { id },
        data: updateData,
      });

      return criteria;
    } catch (error: any) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        throw new BadRequestException(
          `Kode kriteria "${dto.code}" sudah digunakan`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.criteria.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Kriteria tidak ditemukan');
    }

    const criteria = await this.prisma.criteria.update({
      where: { id },
      data: { is_active: false },
    });

    return criteria;
  }
}
