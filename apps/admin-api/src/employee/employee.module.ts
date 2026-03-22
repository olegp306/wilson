import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { TenantEmployeeController } from './tenant-employee.controller';

@Module({
  controllers: [EmployeeController, TenantEmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
