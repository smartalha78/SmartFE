// BankPaymentVoucher.jsx
import React from 'react';
import VoucherScreen from './GenericVoucherScreen';

const BankPaymentVoucher = () => {
  return (
    <VoucherScreen
      voucherType="BPV"  // This will filter by BPV only
      screenTitle="Bank Payment Voucher"
      voucherTypeName="Bank Payment Voucher"
      defaultVoucherType="BPV"
      showVoucherTypeFilter={false} // Hide type filter
      voucherTypes={[
        { code: "BPV", name: "Bank Payment Voucher" },
      ]}
    />
  );
};

export default BankPaymentVoucher;