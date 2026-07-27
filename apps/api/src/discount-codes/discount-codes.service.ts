import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';

@Injectable()
export class DiscountCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateDiscountCodeDto, ip?: string) {
    const code = dto.code.toUpperCase().trim();

    const existing = await this.prisma.discountCode.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException('Discount code already exists');
    }

    const created = await this.prisma.discountCode.create({
      data: {
        code,
        percentage: dto.percentage,
        createdById: user.id,
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'CREATE_DISCOUNT_CODE',
      entity: 'DiscountCode',
      entityId: created.id,
      metadata: { code, percentage: dto.percentage },
      ip,
    });

    return created;
  }

  async findAll() {
    return this.prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, email: true } },
      },
    });
  }

  async toggle(id: string, user: AuthUser, ip?: string) {
    const code = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!code) {
      throw new NotFoundException('Discount code not found');
    }

    const updated = await this.prisma.discountCode.update({
      where: { id },
      data: { isActive: !code.isActive },
    });

    await this.audit.log({
      userId: user.id,
      action: 'TOGGLE_DISCOUNT_CODE',
      entity: 'DiscountCode',
      entityId: id,
      metadata: { isActive: updated.isActive },
      ip,
    });

    return updated;
  }

  async validate(code: string) {
    const found = await this.prisma.discountCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!found || !found.isActive) {
      throw new BadRequestException('Invalid or inactive discount code');
    }

    return {
      code: found.code,
      percentage: found.percentage,
      isActive: found.isActive,
    };
  }
}
