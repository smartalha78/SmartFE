import HRMSGenericManager from './HRMSGenericManager';

const HRMSEmployeeType = (props) => (
  <HRMSGenericManager 
    moduleType="employeetype"
    {...props}
  />
);

export default HRMSEmployeeType;