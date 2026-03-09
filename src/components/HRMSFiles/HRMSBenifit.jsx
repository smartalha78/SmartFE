import HRMSGenericManager from './HRMSGenericManager';

const HRMSBenifit = (props) => (
  <HRMSGenericManager 
    moduleType="benefit"
    {...props} // Pass through any props like onClose, onBack, etc.
  />
);

export default HRMSBenifit;