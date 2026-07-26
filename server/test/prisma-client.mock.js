const createEnum = (values) => Object.fromEntries(values.map((value) => [value, value]));

module.exports = {
  ApprovalStatus: createEnum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED']),
  CashMovementDirection: createEnum(['IN', 'OUT']),
  CashMovementType: createEnum([
    'OPENING',
    'CREDIT_DISBURSEMENT',
    'PAYMENT_COLLECTION',
    'DEPOSIT_TO_VAULT',
    'WITHDRAWAL_FROM_VAULT',
    'ADJUSTMENT',
    'CLOSING',
  ]),
  CashSessionStatus: createEnum(['OPEN', 'CLOSED']),
  ClientStatus: createEnum(['ACTIVE', 'WATCHLIST', 'BLOCKED', 'INACTIVE']),
  CreditStatus: createEnum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAID', 'OVERDUE', 'DEFAULTED', 'CANCELED']),
  CreditType: createEnum(['EXPRESS', 'GARANTIA']),
  DocumentType: createEnum(['DNI', 'VOUCHER', 'CONTRACT', 'GUARANTEE', 'PHOTO', 'OTHER']),
  InterestCalculationMethod: createEnum(['CONTINUOUS', 'EQUAL_INSTALLMENTS']),
  PaymentFrequency: createEnum(['DAILY', 'WEEKLY', 'MONTHLY']),
  PaymentMethod: createEnum(['CASH', 'TRANSFER', 'YAPE', 'PLIN', 'CARD', 'OTHER']),
  PaymentStatus: createEnum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELED']),
  PrismaClient: class PrismaClient {},
  StorageProvider: createEnum(['LOCAL', 'S3']),
  UserRole: createEnum(['ADMIN', 'MANAGER', 'ANALYST', 'CASHIER', 'VIEWER']),
};
