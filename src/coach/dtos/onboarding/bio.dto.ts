import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class BioDto {
  @ApiProperty({
    description:
      'Coach biography detailing their experience and coaching philosophy',
    example:
      'Certified personal trainer with over 5 years of experience in weight loss coaching. I focus on sustainable lifestyle changes and helping clients build confidence in their fitness journey.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  bio: string;
}
