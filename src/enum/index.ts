export enum Shift {
  MorningFrom = '06:00:00',
  MorningTo = '13:59:59',
  AfternoonFrom = '14:00:00',
  AfternoonTo = '21:59:59',
  NightFrom = '22:00:00',
  NightTo = '05:59:59',
}

export enum DayName {
  Sunday = 'Sun',
  Monday = 'Mon',
  Tuesday = 'Tue',
  Wednesday = 'Wed',
  Thursday = 'Thu',
  Friday = 'Fri',
  Saturday = 'Sat',
}
export enum DayId {
  Sunday = 1,
  Monday = 2,
  Tuesday = 3,
  Wednesday = 4,
  Thursday = 5,
  Friday = 6,
  Saturday = 7,
}
export enum FetchMode {
  Some = 'some',
  Full = 'full',
}

export enum OrderStatus {
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  DELIVERING = 'DELIVERING',
  FAILED = 'FAILED',
  IDLE = 'IDLE',
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  STUCK = 'STUCK',
}

export enum InvoiceHistoryStatusEnum {
  PAID = 'PAID',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  STARTED = 'STARTED',
}

export enum CouponCreatorType {
  ADMIN = 'Admin',
  RESTAURANT = 'Restaurant',
}

export enum CouponType {
  RESTAURANT = 'restaurant',
  SYS_CATEGORY = 'system_category',
  SKU = 'sku',
}

export enum CouponFilterType {
  INCLUDED = 'included',
  EXCLUDED = 'excluded',
}

export enum CalculationType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum OrderMilestones {
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  PICKED_UP = 'picked_up',
  FAILED = 'failed',
  CONFIRMED = 'confirmed',
  CREATED = 'created',
  START_TO_PROCESS = 'started_to_process',
}
