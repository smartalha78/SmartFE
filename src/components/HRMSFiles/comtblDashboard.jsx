import HRMSGenericManager from './HRMSGenericManager';

const HRMSDashboard = (props) => (
  <HRMSGenericManager 
    moduleType="dashboard"
    {...props}
  />
);

export default HRMSDashboard;