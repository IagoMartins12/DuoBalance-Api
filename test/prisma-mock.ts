// test/prisma-mock.ts
export const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
  },
  household: {
    findUnique: jest.fn(),
  },

  // Task templates
  taskTemplate: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },

  // Domestic task entries
  domesticTaskEntry: {
    findMany: jest.fn(),
    create: jest.fn(),
  },

  // Credit cards
  creditCard: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },

  // Expenses (usadas pelo módulo de cartão)
  expense: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },

  // Parcelas
  installment: {
    findMany: jest.fn(),
    createMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  budget: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }, // GOALS
  goal: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },

  // DREAMS
  dream: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});
