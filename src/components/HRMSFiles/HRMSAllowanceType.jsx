import React from 'react';
import HRMSGenericManager from './HRMSGenericManager';

const HRMSAllowanceType = (props) => (
  <HRMSGenericManager 
    moduleType="allowance"
    {...props} // Pass through any props like onClose, onBack, etc.
  />
);

export default HRMSAllowanceType;