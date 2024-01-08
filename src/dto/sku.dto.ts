import { OptionSelection } from 'src/type';

export class SkuDTO {
  sku_id: number;
  price: number;
  price_after_discount: number;
  unit: string;
  is_standard: boolean;
  calorie_kcal: number;
  carb_g: number;
  protein_g: number;
  fat_g: number;
  portion_customization: OptionSelection[];
  // taste_customization: OptionSelection[];
}
