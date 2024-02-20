import { AhamoveOrderEntity } from 'src/entity/ahamove-order.entity';
import { AhamoveOrder } from '../dto/ahamove.dto';

export class AhamoveMapper {
  static fromDTOtoEntity(entityDTO: AhamoveOrder): AhamoveOrderEntity {
    if (!entityDTO) {
      return;
    }
    const entity = new AhamoveOrderEntity();
    const fields = Object.getOwnPropertyNames(entityDTO);
    fields.forEach((field) => {
      entity[field] = entityDTO[field];
    });
    return entity;
  }
}
