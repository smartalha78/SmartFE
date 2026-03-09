import HRMSGenericManager from './HRMSGenericManager';

const HRMSCountry = (props) => (
  <HRMSGenericManager 
    moduleType="country"
    {...props}
  />
);

export default HRMSCountry;