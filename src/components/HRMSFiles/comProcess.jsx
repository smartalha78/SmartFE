import HRMSGenericManager from './HRMSGenericManager';

const HRMSProcess = (props) => (
  <HRMSGenericManager 
    moduleType="process"
    {...props}
  />
);

export default HRMSProcess;