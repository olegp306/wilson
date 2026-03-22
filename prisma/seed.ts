import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_TENANT_ID = '11111111-1111-4111-8111-111111111111';
const DEMO_ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const DEMO_MEMBER_ID = '33333333-3333-4333-8333-333333333333';

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    create: {
      id: DEMO_TENANT_ID,
      name: 'Demo Tenant',
      slug: 'demo',
      status: 'ACTIVE',
    },
    update: {
      name: 'Demo Tenant',
      status: 'ACTIVE',
    },
  });

  const admin = await prisma.employee.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'alex.admin@demo.wilson.local',
      },
    },
    create: {
      id: DEMO_ADMIN_ID,
      tenantId: tenant.id,
      email: 'alex.admin@demo.wilson.local',
      displayName: 'Alex Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    update: {
      displayName: 'Alex Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const member = await prisma.employee.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'blake.member@demo.wilson.local',
      },
    },
    create: {
      id: DEMO_MEMBER_ID,
      tenantId: tenant.id,
      email: 'blake.member@demo.wilson.local',
      displayName: 'Blake Member',
      role: 'MEMBER',
      status: 'ACTIVE',
      managerId: admin.id,
    },
    update: {
      displayName: 'Blake Member',
      managerId: admin.id,
      status: 'ACTIVE',
    },
  });

  for (const agentName of ['task-agent', 'calendar-agent', 'mail-agent']) {
    await prisma.agentConfig.upsert({
      where: {
        tenantId_agentName: {
          tenantId: tenant.id,
          agentName,
        },
      },
      create: {
        tenantId: tenant.id,
        agentName,
        enabled: true,
        settings: {},
      },
      update: { enabled: true },
    });
  }

  console.log('Seed complete:', {
    tenantId: tenant.id,
    adminId: admin.id,
    memberId: member.id,
    managerRelation: `${member.displayName} reports to ${admin.displayName}`,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
