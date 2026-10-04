import { beforeEach, expect, it } from 'vitest';
import { getFees,saveFees,resetFees,DEFAULT_FEES } from '@/lib/feeConfig';
beforeEach(()=>localStorage.clear());
it('persists custom fees and restores defaults',()=>{
  const fees=[{label:'Maintenance',amount:'500',editable:true}];
  saveFees(fees); expect(getFees()).toEqual(fees);
  resetFees(); expect(getFees()).toEqual(DEFAULT_FEES);
});
it('uses defaults when local data is malformed',()=>{
  localStorage.setItem('rwa_fee_config','not-json'); expect(getFees()).toEqual(DEFAULT_FEES);
});
