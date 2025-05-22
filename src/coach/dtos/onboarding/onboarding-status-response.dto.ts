import { ApiProperty } from '@nestjs/swagger';

export class OnboardingStatusResponseDto {
  @ApiProperty({
    description: 'Percentage of the onboarding process that has been completed',
    example: 75,
    minimum: 0,
    maximum: 100,
  })
  completionPercentage: number;

  @ApiProperty({
    description: 'Number of onboarding fields that have been completed',
    example: 6,
  })
  completedFields: number;

  @ApiProperty({
    description: 'Total number of fields required for onboarding completion',
    example: 8,
  })
  totalFields: number;

  @ApiProperty({
    description: 'Whether the onboarding process has been fully completed',
    example: false,
  })
  isComplete: boolean;
}
