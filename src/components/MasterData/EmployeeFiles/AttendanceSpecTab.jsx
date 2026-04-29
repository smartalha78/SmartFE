// tabs/AttendanceSpecTab.jsx

import React, { useState } from "react";
import {
  FaSave,
  FaTimes,
  FaEdit,
  FaClock,
  FaSpinner,
  FaSyncAlt
} from "react-icons/fa";
import "./AttendanceSpecTab.css";

const AttendanceSpecTab = ({
  data,
  editState,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
  saving,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Extract the attendance data properly - it's an array with one item
  const attendanceData = data?.data?.[0] || data?.[0] || {};
  
  const index = 0;
  const isEditingThis = editState?.editing?.[index] || false;

  // Helper function to convert string "True"/"False" to boolean
  const isChecked = (value) => {
    if (value === true) return true;
    if (value === false) return false;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return false;
  };

  const handleCheckboxChange = (name, checked) => {
    // Convert boolean to string "True"/"False" to match database format
    const value = checked ? "True" : "False";
    onInputChange(index, name, value, false);
  };

  const handleNumberChange = (name, value) => {
    onInputChange(index, name, value === "" ? "" : value, false);
  };

  // Attendance settings fields that are in HRMSEmployee table
  const attendanceFields = [
    { name: "AutoAttendanceAllow", label: "Auto Attendance", type: "checkbox" },
    { name: "OverTimeAllow", label: "Over Time", type: "checkbox" },
    { name: "offdayBonusAllow", label: "Off Day Bonus", type: "checkbox" },
    { name: "HolyDayBonusAllow", label: "Holiday Bonus", type: "checkbox" },
    { name: "LateTimeAllow", label: "Late Time", type: "checkbox" },
    { name: "EarlyLateAllow", label: "Early/Late Deduction", type: "checkbox" },
    { name: "EmployeeEarlyLateDeductionOnTimeActive", label: "Early/Late Ded. Per Mintue", type: "checkbox" },
    { name: "EarlyLateNoofDeductionExempt", label: "Early/Late Exempt Days", type: "number" },
    { name: "PunctuailityAllown", label: "Punctuality Allow", type: "checkbox" },
    { name: "EmployeeCommisionBonusActive", label: "Commission Bonus", type: "checkbox" },
    
    
    
    { name: "EmployeeCommisionBonusPer", label: "Commission Bonus %", type: "number" },
    { name: "OTAllowedPerDay", label: "OT Allowed Per Day", type: "number" }
  ];

  return (
    <div className="attendance-spec-tab">
      <div className="tab-header">
        <h4>
          <FaClock /> Attendance Settings
        </h4>

        <div className="tab-actions">
          <button
            type="button"
            className="btn-icon refresh"
            onClick={async () => {
              setRefreshing(true);
              await onRefresh?.();
              setRefreshing(false);
            }}
            disabled={refreshing || saving}
          >
            <FaSyncAlt className={refreshing ? "spinner" : ""} />
          </button>

          {!isEditingThis ? (
            <button
              type="button"
              className="btn-icon edit"
              onClick={() => onEdit(index)}
              disabled={!isEditing || saving}
            >
              <FaEdit />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-icon save"
                onClick={() => onSave(index, false)}
                disabled={saving}
              >
                {saving ? <FaSpinner className="spinner" /> : <FaSave />}
              </button>

              <button
                type="button"
                className="btn-icon cancel"
                onClick={() => onCancel(index)}
                disabled={saving}
              >
                <FaTimes />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="attendance-grid">
        {attendanceFields.map((field) => {
          const fieldValue = attendanceData[field.name];
          
          return (
            <div className="form-group" key={field.name}>
              <label className="field-label">{field.label}</label>

              {field.type === "checkbox" ? (
                <label className="custom-checkbox">
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={isChecked(fieldValue)}
                    onChange={(e) =>
                      handleCheckboxChange(field.name, e.target.checked)
                    }
                    disabled={!isEditingThis || saving}
                  />
                  <span className="checkmark"></span>
                </label>
              ) : (
                <input
                  type="number"
                  name={field.name}
                  value={fieldValue ?? ""}
                  onChange={(e) =>
                    handleNumberChange(field.name, e.target.value)
                  }
                  disabled={!isEditingThis || saving}
                  placeholder="0"
                  step="any"
                />
              )}
            </div>
          );
        })}
      </div>
      
      {attendanceData.Code && (
        <div className="info-message" style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
          <strong>Employee Code:</strong> {attendanceData.Code}
        </div>
      )}
    </div>
  );
};

export default AttendanceSpecTab;