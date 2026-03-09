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
  
  // Extract the attendance data properly
  const attendanceData = data?.data?.[0] || data?.[0] || data || {};
  
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

  // CORRECT field names based on your debug data
  const attendanceFields = [
    { name: "offdayBonusAllow", label: "Off Day Bonus Allow", type: "checkbox" },
    { name: "AutoAttendanceAllow", label: "Auto Attendance Allow", type: "checkbox" },
    { name: "OverTimeAllow", label: "Over Time Allow", type: "checkbox" },
    { name: "LateTimeAllow", label: "Late Time Allow", type: "checkbox" },
    { name: "EarlyLateAllow", label: "Early/Late Allow", type: "checkbox" },
    { name: "HolyDayBonusAllow", label: "Holiday Bonus Allow", type: "checkbox" },
    { name: "PunctuailityAllown", label: "Punctuality Allow", type: "checkbox" },
    { name: "EmployeeCommisionBonusActive", label: "Commission Bonus Active", type: "checkbox" },
    { name: "EmployeeEarlyLateDeductionOnTimeActive", label: "Early/Late Deduction Active", type: "checkbox" },
    { name: "EarlyLateNoofDeductionExempt", label: "Early/Late Exempt Days", type: "number" },
    { name: "NoOfDependant", label: "Number of Dependants", type: "number" },
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
            disabled={refreshing}
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
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceSpecTab;