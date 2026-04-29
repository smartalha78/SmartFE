// BankReceiptVoucher.jsx
import React from 'react';
import VoucherScreen from './GenericVoucherScreen';

const BankReceiptVoucher = () => {
  return (
    <VoucherScreen
      voucherType="BRV"  // This will filter by BRV only
      screenTitle="Bank Receipt Voucher"
      voucherTypeName="Bank Receipt Voucher"
      defaultVoucherType="BRV"
      showVoucherTypeFilter={false} // Hide type filter
      voucherTypes={[
        { code: "BRV", name: "Bank Receipt Voucher" },
      ]}
    />
  );
};

export default BankReceiptVoucher;