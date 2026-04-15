import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.issueLog.deleteMany({});
  await prisma.issueDepartment.deleteMany({});
  await prisma.complaintAssignment.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Seeding departments...');
  const water = await prisma.department.create({ data: { name: 'Water' } });
  const roads = await prisma.department.create({ data: { name: 'Roads' } });
  const electricity = await prisma.department.create({ data: { name: 'Electricity' } });

  console.log('Seeding users...');
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Super Admin', email: 'admin@portal.com', passwordHash: adminPass, role: 'ADMIN' }
  });

  const waterOfficer = await prisma.user.create({
    data: { name: 'Water Dept Officer', email: 'water@portal.com', passwordHash: userPass, role: 'DEPT_OFFICER', departmentId: water.id }
  });

  const roadsOfficer = await prisma.user.create({
    data: { name: 'Roads Dept Officer', email: 'roads@portal.com', passwordHash: userPass, role: 'DEPT_OFFICER', departmentId: roads.id }
  });

  console.log('Seeding issues...');
  await prisma.issue.create({
    data: {
      title: 'Pothole on Main St.',
      description: 'Large pothole causing traffic jam. Needs immediate repair.',
      status: 'OPEN',
      priority: 'HIGH',
      latitude: 19.0760,
      longitude: 72.8777,
      creatorId: roadsOfficer.id,
      departments: {
        create: [ { departmentId: roads.id } ]
      },
      logs: {
        create: {
          userId: roadsOfficer.id,
          actionDescription: 'Issue created'
        }
      }
    }
  });

  await prisma.issue.create({
    data: {
      title: 'Water Pipe Burst',
      description: 'Water pipe burst near the crossing, affecting electricity lines.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      latitude: 19.0800,
      longitude: 72.8800,
      creatorId: admin.id,
      departments: {
        create: [ { departmentId: water.id }, { departmentId: electricity.id } ]
      },
      logs: {
        create: {
          userId: admin.id,
          actionDescription: 'Issue created and assigned to Water and Electricity'
        }
      }
    }
  });

  console.log('Seeding complaints...');
  await prisma.complaint.create({
    data: {
      citizenName: 'John Doe',
      description: 'Massive pothole in front of the grocery store, very dangerous for vehicles.',
      issue_type: 'Roads',
      location: '123 Main St',
      latitude: 19.076,
      longitude: 72.8777,
      status: 'RECEIVED',
    }
  });

  await prisma.complaint.create({
    data: {
      citizenName: 'Jane Smith',
      description: 'Water leak from a pipe near the junction, it has been leaking for hours and flooding the road.',
      issue_type: 'Water',
      location: 'Junction Ave',
      latitude: 19.082,
      longitude: 72.875,
      status: 'ASSIGNED',
      assignments: {
        create: [{ department: { connect: { id: water.id } } }]
      }
    }
  });

  await prisma.complaint.create({
    data: {
      citizenName: 'Raj Kumar',
      description: 'Electricity pole sparking in heavy rain. Street lights also not working.',
      issue_type: 'Electricity',
      location: 'Station Road, Block B',
      status: 'ASSIGNED',
      assignments: {
        create: [{ department: { connect: { id: electricity.id } } }]
      }
    }
  });

  await prisma.complaint.create({
    data: {
      citizenName: 'Anonymous Troll',
      description: 'The government painted my car pink overnight. This is fake.',
      issue_type: 'Other',
      location: 'Fake Street',
      status: 'CLOSED',
      is_flagged: true,
    }
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
