const { DocumentsService } = require('../../src/documents/documents.service');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

test('upload stores actual bytes and download checks organization and owner', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'solfin-doc-test-'));
  let document;
  const prisma = {
    appUser: { findUnique: jest.fn(async () => ({ id: 'analyst', organizationId: 'org', isActive: true })) },
    document: {
      create: jest.fn(async ({ data }) => { document = { ...data, id: 'doc' }; return document; }),
      findFirst: jest.fn(async () => document),
    },
  };
  const config = { get: (name) => ({ STORAGE_LOCAL_DIRECTORY: directory, NODE_ENV: 'production' })[name] };
  const service = new DocumentsService(prisma, config);
  const buffer = Buffer.from('%PDF-1.7\nTest document bytes');
  try {
    const uploaded = await service.upload({ buffer, size: buffer.length, originalname: '../contract.pdf' }, 'analyst');
    expect(uploaded.sizeBytes).toBe(buffer.length);
    const downloaded = await service.download('doc', 'analyst');
    expect(downloaded.content).toEqual(buffer);
    expect(prisma.document.findFirst).toHaveBeenCalledWith({ where: { id: 'doc', organizationId: 'org' } });
    await expect(service.download('doc', 'someone-else')).rejects.toThrow('no encontrado');
    await expect(service.upload({ buffer: Buffer.from('<script>'), size: 8, originalname: 'fake.pdf' }, 'analyst')).rejects.toThrow('Solo se admiten');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('production refuses implicit temporary storage', async () => {
  const service = new DocumentsService({ appUser: { findUnique: async () => ({ id: 'a', organizationId: 'org', isActive: true }) } }, { get: (name) => name === 'NODE_ENV' ? 'production' : undefined });
  await expect(service.upload({ buffer: Buffer.from('%PDF-1.7'), size: 8, originalname: 'file.pdf' }, 'a')).rejects.toThrow('persistente');
});
