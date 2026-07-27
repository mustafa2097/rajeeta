import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { SuggestDoctorsDto } from './dto/suggest-doctors.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-doctors')
  suggestDoctors(@Body() dto: SuggestDoctorsDto) {
    return this.aiService.suggestDoctors(dto.diagnosis);
  }
}
