import HRMSGenericManager from './HRMSGenericManager';

const HRMSDeductionType = (props) => (
  <HRMSGenericManager 
    moduleType="deduction"
    {...props}
  />
);

export default HRMSDeductionType;