import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { LectoresModule } from './lectores/lectores.module';
import { CategoriasModule } from './categorias/categorias.module';
import { MaterialBibliograficoModule } from './material-bibliografico/material-bibliografico.module';
import { AutorModule } from './autor/autor.module';
import { AutorMaterialModule } from './autor-material/autor-material.module';
import { MaterialFisicoModule } from './material-fisico/material-fisico.module';
import { MaterialVirtualModule } from './material-virtual/material-virtual.module';
import { PrestamosModule } from './prestamos/prestamos.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    CommonModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsuariosModule,
    AuthModule,
    LectoresModule,
    CategoriasModule,
    MaterialBibliograficoModule,
    AutorModule,
    AutorMaterialModule,
    MaterialFisicoModule,
    MaterialVirtualModule,
    ScheduleModule.forRoot(),
    PrestamosModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
