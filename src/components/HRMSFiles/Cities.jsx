// HRMSCityManager.js - Wrapper component
import React, { useContext } from "react";
import { AuthContext } from "../../AuthContext";
import HRMSGenericManager from "./HRMSGenericManager";

const HRMSCity = (props) => {
    const { credentials } = useContext(AuthContext);
    
    return (
        <HRMSGenericManager
            {...props}
            moduleType="city"
           
        />
    );
};

export default HRMSCity;