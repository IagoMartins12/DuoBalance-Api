export const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
  },
  household: {
    findUnique: jest.fn(),
  },
  taskTemplate: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  domesticTaskEntry: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
});
