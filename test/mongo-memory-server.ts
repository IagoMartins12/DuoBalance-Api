import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export async function startInMemoryMongo() {
  mongod = await MongoMemoryServer.create({
    instance: { dbName: 'testdb' },
  });

  const uri = mongod.getUri();

  // ⚠️ getUri() = mongodb://127.0.0.1:XXXXX/, sem DB no final
  process.env.DATABASE_URL = `${uri}testdb`; // <- banco obrigatório
}

export async function stopInMemoryMongo() {
  if (mongod) await mongod.stop();
}
