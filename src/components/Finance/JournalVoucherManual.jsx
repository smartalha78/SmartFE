// JournalVoucher.jsx
import React from 'react';
import VoucherScreen from './GenericVoucherScreen';

const JournalVoucher = () => {
  return (
    <VoucherScreen
      voucherType="JVM"  // This will filter by JV only
      screenTitle="Journal Voucher"
      voucherTypeName="Journal Voucher"
      defaultVoucherType="JV"
      showVoucherTypeFilter={false} // Hide type filter
      voucherTypes={[
        { code: "JVM", name: "Journal Voucher" },
      ]}
    />
  );
};

export default JournalVoucher;