import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { timeToMinutes } from '../common/utils/subscription.util';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getByDoctor(doctorId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return this.prisma.availabilitySlot.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateOwn(user: AuthUser, dto: UpdateAvailabilityDto) {
    if (!user.doctorProfileId) {
      throw new ForbiddenException('Doctor profile required');
    }

    for (const slot of dto.slots) {
      if (timeToMinutes(slot.startTime) >= timeToMinutes(slot.endTime)) {
        throw new BadRequestException(
          `Invalid slot times: ${slot.startTime} - ${slot.endTime}`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.deleteMany({
        where: { doctorId: user.doctorProfileId! },
      });

      await tx.availabilitySlot.createMany({
        data: dto.slots.map((s) => ({
          doctorId: user.doctorProfileId!,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable ?? true,
        })),
      });
    });

    return this.getByDoctor(user.doctorProfileId);
  }
}
