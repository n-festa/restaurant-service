import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TRUE } from 'src/constant';
import { SysCategory } from 'src/entity/sys-category.entity';
import { Repository } from 'typeorm';
import { SysCategoryDTO } from './dto/sys-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(SysCategory)
    private readonly sysCategoryRepo: Repository<SysCategory>,
  ) {}

  async getCategories(): Promise<SysCategoryDTO[]> {
    const categoriesDTO: SysCategoryDTO[] = [];
    const categories = await this.sysCategoryRepo.find({
      where: {
        is_active: TRUE,
      },
    });

    for (const category of categories) {
      const categoryDTO = new SysCategoryDTO();
      categoryDTO.sys_category_id = category.sys_category_id;
      categoryDTO.type = category.type;
      categoryDTO.image_url = category.image_obj.url;
      category.extension.forEach((ext) => {
        categoryDTO.name.push({
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        });
        categoryDTO.description.push({
          ISO_language_code: ext.ISO_language_code,
          text: ext.description,
        });
      });

      categoriesDTO.push(categoryDTO);
    }

    return categoriesDTO;
  }
}
