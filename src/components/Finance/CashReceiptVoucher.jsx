// CashReceiptVoucher.jsx
import React from 'react';
import VoucherScreen from './GenericVoucherScreen';

const CashReceiptVoucher = () => {
  return (
    <VoucherScreen
      voucherType="CRV"  // This will filter by CRV only
      screenTitle="Cash Receipt Voucher"
      voucherTypeName="Cash Receipt Voucher"
      defaultVoucherType="CRV"
      showVoucherTypeFilter={false} // Hide type filter
      voucherTypes={[
        { code: "CRV", name: "Cash Receipt Voucher" },
      ]}
    />
  );
};

export default CashReceiptVoucher;