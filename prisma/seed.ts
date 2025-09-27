// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const data = [
    {
      title: 'Flight A123 disappearance',
      type: 'Disappearance',
      date: '2014-03-08',
      country: 'MY',
      summary:
        'A scheduled international passenger flight disappeared over the South China Sea.',
      site: 'South China Sea',
      aircraft: 'Boeing 777-200ER',
      operator: 'Malaysia Airlines',
      fatalities: 239,
      injuries: 0,
      survivors: 0,
      origin: 'Kuala Lumpur',
      destination: 'Beijing',
    },
    {
      title: 'Air India Express Flight 812 crash',
      type: 'Accident',
      date: '2010-05-22',
      country: 'IN',
      summary:
        'A Boeing 737 overshot the runway at Mangalore International Airport.',
      site: 'Mangalore',
      aircraft: 'Boeing 737-800',
      operator: 'Air India Express',
      fatalities: 158,
      injuries: 8,
      survivors: 8,
      origin: 'Dubai',
      destination: 'Mangalore',
    },
    {
      title: 'TWA Flight 800 explosion',
      type: 'Accident',
      date: '1996-07-17',
      country: 'US',
      summary: 'In-flight breakup due to explosion shortly after takeoff.',
      site: 'Off Long Island, NY',
      aircraft: 'Boeing 747',
      operator: 'TWA',
      fatalities: 230,
      injuries: 0,
      survivors: 0,
      origin: 'JFK',
      destination: 'Paris',
    },
  ];

  for (const r of data) {
    await prisma.report.create({ data: r });
  }

  console.log('Seeded', data.length, 'reports');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
