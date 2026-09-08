import { PrtType } from 'flow-platform';

describe('PrtType', () => {
  it('exposes the ix.serv-compatible print types', () => {
    expect(Object.values(PrtType)).toEqual([
      PrtType.PRTTYPE_NONE,
      PrtType.PRTTYPE_ORDER,
      PrtType.PRTTYPE_REPORT,
      PrtType.PRTTYPE_DOCUMENT,
      PrtType.PRTTYPE_TRAFU
    ]);
  });
});
