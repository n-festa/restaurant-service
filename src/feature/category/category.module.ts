import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysCategory } from 'src/entity/sys-category.entity';
import { SysCategoryExt } from 'src/entity/sys-category-ext.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysCategory, SysCategoryExt])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
