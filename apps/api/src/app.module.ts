import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '../../.env'),
        join(process.cwd(), '.env'),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
