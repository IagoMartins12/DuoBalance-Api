import { SplitService } from './split.service';
import { SplitMethod } from '@prisma/client';

describe('SplitService', () => {
  let service: SplitService;

  const baseConfig = {
    user1Id: 'u1',
    user2Id: 'u2',
  };

  beforeEach(() => {
    service = new SplitService();
  });

  // ------------------------------------
  // 🔹 calculateExpenseSplit
  // ------------------------------------

  it('FIFTY_FIFTY deve dividir 50/50 uma despesa compartilhada', () => {
    const result = service.calculateExpenseSplit(
      {
        ...baseConfig,
        splitMethod: SplitMethod.FIFTY_FIFTY,
        customSplit: null,
      },
      { user1Income: 0, user2Income: 0 },
      {
        id: 'e1',
        amount: 200,
        isIndividual: false,
        createdById: 'u1',
      },
    );

    expect(result.user1Share).toBe(100);
    expect(result.user2Share).toBe(100);
  });

  it('CUSTOM deve respeitar percentuais customizados', () => {
    const result = service.calculateExpenseSplit(
      {
        ...baseConfig,
        splitMethod: SplitMethod.CUSTOM,
        customSplit: { user1Percentage: 70, user2Percentage: 30 },
      },
      { user1Income: 0, user2Income: 0 },
      {
        id: 'e1',
        amount: 100,
        isIndividual: false,
        createdById: 'u1',
      },
    );

    expect(result.user1Share).toBeCloseTo(70);
    expect(result.user2Share).toBeCloseTo(30);
  });

  it('PROPORTIONAL deve dividir proporcionalmente à renda', () => {
    const result = service.calculateExpenseSplit(
      {
        ...baseConfig,
        splitMethod: SplitMethod.PROPORTIONAL,
        customSplit: null,
      },
      { user1Income: 3000, user2Income: 1000 },
      {
        id: 'e1',
        amount: 400,
        isIndividual: false,
        createdById: 'u1',
      },
    );

    // user1 tem 75% da renda, user2 25%
    expect(result.user1Share).toBeCloseTo(300);
    expect(result.user2Share).toBeCloseTo(100);
  });

  it('ONE_PAYS deve atribuir 100% para quem criou a despesa', () => {
    const result1 = service.calculateExpenseSplit(
      {
        ...baseConfig,
        splitMethod: SplitMethod.ONE_PAYS,
        customSplit: null,
      },
      { user1Income: 0, user2Income: 0 },
      {
        id: 'e1',
        amount: 150,
        isIndividual: false,
        createdById: 'u1',
      },
    );

    expect(result1.user1Share).toBe(150);
    expect(result1.user2Share).toBe(0);

    const result2 = service.calculateExpenseSplit(
      {
        ...baseConfig,
        splitMethod: SplitMethod.ONE_PAYS,
        customSplit: null,
      },
      { user1Income: 0, user2Income: 0 },
      {
        id: 'e2',
        amount: 200,
        isIndividual: false,
        createdById: 'u2',
      },
    );

    expect(result2.user1Share).toBe(0);
    expect(result2.user2Share).toBe(200);
  });

  it('NO_SPLIT deve retornar 0/0 para responsabilidade (não entra na cobrança)', () => {
    const result = service.calculateExpenseSplit(
      {
        ...baseConfig,
        splitMethod: SplitMethod.NO_SPLIT,
        customSplit: null,
      },
      { user1Income: 0, user2Income: 0 },
      {
        id: 'e1',
        amount: 500,
        isIndividual: false,
        createdById: 'u1',
      },
    );

    expect(result.user1Share).toBe(0);
    expect(result.user2Share).toBe(0);
  });

  it('despesa individual deve ser 100% do usuário dono', () => {
    const result = service.calculateExpenseSplit(
      {
        ...baseConfig,
        splitMethod: SplitMethod.FIFTY_FIFTY,
        customSplit: null,
      },
      { user1Income: 0, user2Income: 0 },
      {
        id: 'e1',
        amount: 80,
        isIndividual: true,
        individualUserId: 'u2',
        createdById: 'u2',
      },
    );

    expect(result.user1Share).toBe(0);
    expect(result.user2Share).toBe(80);
  });

  // ------------------------------------
  // 🔹 calculateFinancialEquity
  // ------------------------------------

  it('deve calcular equidade financeira básica (50/50)', () => {
    const result = service.calculateFinancialEquity({
      config: {
        ...baseConfig,
        splitMethod: SplitMethod.FIFTY_FIFTY,
        customSplit: null,
      },
      incomes: [
        { userId: 'u1', amount: 3000 },
        { userId: 'u2', amount: 2000 },
      ],
      expenses: [
        // U1 paga 300
        {
          id: 'e1',
          amount: 300,
          isIndividual: false,
          createdById: 'u1',
        },
        // U2 paga 100
        {
          id: 'e2',
          amount: 100,
          isIndividual: false,
          createdById: 'u2',
        },
        // U2 faz uma despesa individual de 50
        {
          id: 'e3',
          amount: 50,
          isIndividual: true,
          individualUserId: 'u2',
          createdById: 'u2',
        },
      ],
    });

    // Total de despesas = 450
    expect(result.totalExpenses).toBe(450);

    // Quem PAGOU
    expect(result.user1Paid).toBe(300);
    expect(result.user2Paid).toBe(150);

    // Quem DEVERIA pagar:
    // e1 (300) compartilhada 50/50 -> 150 / 150
    // e2 (100) compartilhada 50/50 -> 50 / 50
    // e3 (50) individual de u2 -> 0 / 50
    // user1Should = 150 + 50 + 0 = 200
    // user2Should = 150 + 50 + 50 = 250
    expect(result.user1Should).toBe(200);
    expect(result.user2Should).toBe(250);

    // Saldo
    // user1Balance = 300 - 200 = +100 (pagou a mais)
    // user2Balance = 150 - 250 = -100 (pagou menos)
    expect(result.user1Balance).toBe(100);
    expect(result.user2Balance).toBe(-100);
  });
});
