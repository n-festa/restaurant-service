import { TextByLang } from 'src/type';

export class SysCategoryDTO {
  public sys_category_id: number;
  public type: string;
  public image_url: string;
  public name: TextByLang[] = [];
  public description: TextByLang[] = [];
}
