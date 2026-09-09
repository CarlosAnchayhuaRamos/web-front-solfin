import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { isAbsolute, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import type { UploadedCreditFile } from './documents.types';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async upload(file: UploadedCreditFile | undefined, userId: string) {
    if (!file?.buffer?.length || file.size > 5 * 1024 * 1024) throw new BadRequestException('Archivo requerido; maximo 5 MB');
    const mimeType = this.detectMime(file.buffer);
    if (!mimeType) throw new BadRequestException('Solo se admiten PDF, JPG y PNG');
    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    if (!user?.isActive) throw new BadRequestException('Usuario no disponible');
    const storageKey = randomUUID();
    const provider = this.config.get<string>('STORAGE_PROVIDER') ?? 'LOCAL';
    if (!['LOCAL', 'S3'].includes(provider)) throw new ServiceUnavailableException('Proveedor de almacenamiento invalido');
    if (provider === 'S3') {
      const { client, bucket } = this.s3();
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: storageKey, Body: file.buffer, ContentType: mimeType }));
    }
    if (provider === 'LOCAL') {
      const directory = this.directory();
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, storageKey), file.buffer, { flag: 'wx' });
    }
    // A document becomes attachable only after its bytes have been stored successfully.
    return this.prisma.document.create({ data: {
      organizationId: user.organizationId, uploadedById: user.id,
      fileName: file.originalname.replace(/[\x00-\x1f\\/]/g, '_').slice(0, 200),
      sizeBytes: file.buffer.length, mimeType, storageKey, provider: provider === 'S3' ? 'S3' : 'LOCAL', type: 'OTHER',
    }, select: { id: true, fileName: true, sizeBytes: true } });
  }

  async download(id: string, userId: string) {
    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    if (!user?.isActive) throw new NotFoundException('Archivo no encontrado');
    const document = await this.prisma.document.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!document || !document.sizeBytes || (!document.creditId && document.uploadedById !== userId)) throw new NotFoundException('Archivo no encontrado');
    if (!/^[0-9a-f-]{36}$/i.test(document.storageKey)) throw new NotFoundException('Archivo antiguo sin contenido disponible');
    if (document.provider === 'S3') {
      const { client, bucket } = this.s3();
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: document.storageKey }));
      if (!result.Body) throw new NotFoundException('Archivo no encontrado');
      return { document, content: Buffer.from(await result.Body.transformToByteArray()) };
    }
    return { document, content: await readFile(join(this.directory(), document.storageKey)) };
  }

  private directory() {
    const directory = this.config.get<string>('STORAGE_LOCAL_DIRECTORY');
    if (directory && isAbsolute(directory)) return directory;
    if (this.config.get<string>('NODE_ENV') === 'production') throw new ServiceUnavailableException('Configure STORAGE_LOCAL_DIRECTORY con disco persistente o STORAGE_PROVIDER=S3');
    return join(process.cwd(), '.uploads');
  }

  private s3() {
    const bucket = this.config.get<string>('S3_BUCKET');
    if (!bucket) throw new ServiceUnavailableException('Configure S3_BUCKET');
    return { bucket, client: new S3Client({
      region: this.config.get<string>('AWS_REGION') ?? 'auto',
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      forcePathStyle: this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
    }) };
  }

  private detectMime(buffer: Buffer) {
    if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
    if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
    return null;
  }
}
