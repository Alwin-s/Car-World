import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController, MeController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { ServicesController } from './services.controller';
import { CatalogueController } from './catalogue.controller';

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
  controllers: [
    AppController,
    ServicesController,
    AuthController,
    MeController,
    CatalogueController,
  ],
  providers: [PrismaService, AuthService, JwtAuthGuard],
})
export class AppModule { }
