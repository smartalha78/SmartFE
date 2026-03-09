import HRMSGenericManager from './HRMSGenericManager';

const HRMSCurrency = (props) => (
  <HRMSGenericManager 
    moduleType="currency"
    {...props}
  />
);

export default HRMSCurrency;