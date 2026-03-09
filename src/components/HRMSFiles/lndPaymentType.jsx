import HRMSGenericManager from './HRMSGenericManager';

const LndPaymentType = (props) => (
  <HRMSGenericManager 
    moduleType="paymenttype"
    {...props}
  />
);

export default LndPaymentType;