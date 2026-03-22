import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { validateOrchestratorPayload } from '@wilson/event-contracts';
import { tenantId, employeeId as toEmployeeId } from '@wilson/shared-types';
import { DispatchRequestDto } from './dto/dispatch.dto';
import { DispatchService } from './dispatch.service';

@ApiTags('dispatch')
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Post()
  @ApiOperation({ summary: 'Dispatch a command to the appropriate agent' })
  async dispatchCommand(@Body() body: DispatchRequestDto) {
    const payloadCheck = validateOrchestratorPayload(body.type, body.payload);
    if (!payloadCheck.ok) {
      throw new BadRequestException({
        message: payloadCheck.message,
        details: payloadCheck.details,
      });
    }

    const correlationId = body.correlationId ?? randomUUID();
    return this.dispatch.run({
      type: body.type,
      context: {
        correlationId,
        tenantId: tenantId(body.tenantId),
        employeeId: body.employeeId ? toEmployeeId(body.employeeId) : undefined,
      },
      payload: payloadCheck.value,
    });
  }
}
