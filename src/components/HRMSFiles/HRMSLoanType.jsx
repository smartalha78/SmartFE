import HRMSGenericManager from './HRMSGenericManager';

const HRMSLoanType = (props) => (
  <HRMSGenericManager 
    moduleType="loantype"
    {...props}
  />
);

export default HRMSLoanType;