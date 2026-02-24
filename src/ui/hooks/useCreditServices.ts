// src/ui/hooks/useCreditServices.ts
// Driving adapter hook: connects UI to application use case

import { useMemo } from 'react';
import { CreditService } from '../../domain/entities/CreditService';
import { ICreditServiceUseCase } from '../../domain/ports/input/ICreditServiceUseCase';

export function useCreditServices(useCase: ICreditServiceUseCase): CreditService[] {
  return useMemo(() => useCase.getAllCreditServices(), [useCase]);
}
