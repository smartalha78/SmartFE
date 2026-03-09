import React from 'react';
import HRMSGenericManager from './HRMSGenericManager';

const HRMSDepartment = (props) => (
  <HRMSGenericManager 
    moduleType="department"
    {...props}
  />
);

export default HRMSDepartment;