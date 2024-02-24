import * as Joi from '@hapi/joi';

const locationSchema = Joi.object({
  address: Joi.string().optional(),
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  name: Joi.string().required(),
  mobile: Joi.string().required(),
  cod: Joi.number().required().min(0),
  formattedAddress: Joi.string().optional(),
  shortAddress: Joi.string().optional(),
  addressCode: Joi.string().allow(null).optional(),
  remarks: Joi.string().optional(),
  itemValue: Joi.number().required(),
  requirePod: Joi.boolean().optional(),
});

const itemSchema = Joi.object({
  _id: Joi.string().required(),
  num: Joi.number().required(),
  name: Joi.string().required(),
  price: Joi.number().required(),
});

const packageDetailSchema = Joi.object({
  weight: Joi.number().optional(),
  length: Joi.number().optional(),
  width: Joi.number().optional(),
  height: Joi.number().optional(),
  description: Joi.string().optional(),
});

const postAhaOrderRequestSchema = Joi.object({
  startingPoint: locationSchema.required(),
  destination: locationSchema.required(),
  paymentMethod: Joi.string().required(),
  totalPay: Joi.number().optional(),
  orderTime: Joi.number().optional(),
  promoCode: Joi.string().allow(null).optional(),
  remarks: Joi.string().optional().allow(null),
  adminNote: Joi.string().optional().allow(null),
  routeOptimized: Joi.boolean().optional(),
  idleUntil: Joi.number().optional(),
  items: Joi.array().items(itemSchema).required(),
  packageDetails: Joi.array().items(packageDetailSchema).required(),
  groupServiceId: Joi.string().allow(null).optional(),
  groupRequests: Joi.string().allow(null).optional(),
  serviceType: Joi.string().required(),
});

const coordinateSchema = Joi.object({
  lat: Joi.number().required(),
  long: Joi.number().required(),
});

export const coordinateListSchema = Joi.array().items(coordinateSchema).required();
export default postAhaOrderRequestSchema;
