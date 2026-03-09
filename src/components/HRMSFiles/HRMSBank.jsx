import HRMSGenericManager from './HRMSGenericManager';

const HRMSBank = (props) => (
  <HRMSGenericManager 
    moduleType="bank"
    {...props}
  />
);

export default HRMSBank;