import HRMSGenericManager from './HRMSGenericManager';

const HRMSVehicleType = (props) => (
  <HRMSGenericManager 
    moduleType="vehicletype"
    {...props}
  />
);

export default HRMSVehicleType;