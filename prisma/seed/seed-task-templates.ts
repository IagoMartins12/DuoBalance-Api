import { PrismaClient, TaskType, TaskWeight } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = [
    { name: 'Lavar louça', type: TaskType.DISHES, weight: TaskWeight.MEDIUM },
    { name: 'Cozinhar', type: TaskType.COOKING, weight: TaskWeight.MEDIUM },
    {
      name: 'Limpar cozinha',
      type: TaskType.CLEANING,
      weight: TaskWeight.HEAVY,
    },
    {
      name: 'Passar pano na casa',
      type: TaskType.CLEANING,
      weight: TaskWeight.MEDIUM,
    },
    {
      name: 'Lavar banheiro',
      type: TaskType.CLEANING,
      weight: TaskWeight.HEAVY,
    },
    { name: 'Lavar roupa', type: TaskType.LAUNDRY, weight: TaskWeight.HEAVY },
    { name: 'Dobrar roupa', type: TaskType.LAUNDRY, weight: TaskWeight.LIGHT },
    {
      name: 'Tirar lixo',
      type: TaskType.MAINTENANCE,
      weight: TaskWeight.LIGHT,
    },
    {
      name: 'Fazer compras',
      type: TaskType.GROCERY,
      weight: TaskWeight.MEDIUM,
    },
    {
      name: 'Cuidar do pet',
      type: TaskType.PET_CARE,
      weight: TaskWeight.MEDIUM,
    },
  ];

  for (const t of templates) {
    const existing = await prisma.taskTemplate.findFirst({
      where: { name: t.name, isBuiltIn: true },
    });

    if (!existing) {
      await prisma.taskTemplate.create({
        data: {
          name: t.name,
          description: null,
          type: t.type,
          weight: t.weight,
          isBuiltIn: true,
          isActive: true,
          householdId: null,
        },
      });
    }
  }

  console.log('Task templates seeded com sucesso');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
