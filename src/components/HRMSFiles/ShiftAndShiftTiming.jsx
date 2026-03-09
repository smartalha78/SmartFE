// import React, { useState, useEffect, useContext } from "react";
// import axios from "axios";
// import { AuthContext } from "../../AuthContext";
// import { 
//   FaSave, FaSync, FaEdit,
//   FaCalendarAlt, FaReceipt, 
//   FaCodeBranch, FaFileAlt,
//    FaCheckCircle,
//   FaClock, FaUserClock
// } from "react-icons/fa";
// import "./CashPaymentVoucher.css";

// const ShiftManagement = () => {
//   const { credentials } = useContext(AuthContext);
//   const [loading, setLoading] = useState(false);
//   const [successMessage, setSuccessMessage] = useState("");
//   const [branches, setBranches] = useState([]);
//   const [existingShifts, setExistingShifts] = useState([]);
//   const [selectedShift, setSelectedShift] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   // Head state
//   const [head, setHead] = useState({
//     Code: "",
//     Name: "",
//     IsActive: "true",
//     offcode: "",
//     createdby: credentials?.username || "",
//     createdate: new Date().toISOString().split("T")[0],
//   });

//   // Days of week
//   const daysOfWeek = [
//     "Monday", "Tuesday", "Wednesday", 
//     "Thursday", "Friday", "Saturday", "Sunday"
//   ];

//   // Detail rows state
//   const [details, setDetails] = useState(daysOfWeek.map(day => ({
//     Day: day,
//     OnDutyTime: "08:30",
//     OffDutyTime: "16:30",
//     BeginningIn: "09:30",
//     EndingIn: "10:30",
//     BeginningOut: "14:30",
//     EndingOut: "17:30",
//     BreakStart: "12:30",
//     BreakEnd: "13:15",
//     isRestDay: "false",
//     ShiftMore: "Same Day",
//     ShiftCode: ""
//   })));

//   // Load branches and existing shifts
//   useEffect(() => {
//     if (credentials?.username) {
//       setHead(prev => ({ ...prev, createdby: credentials.username }));
//     }
    
//     // Simulate loading branches
//     setBranches([
//       { code: "0101", name: "Main Branch" },
//       { code: "0102", name: "North Branch" },
//       { code: "0103", name: "South Branch" },
//       { code: "0104", name: "East Branch" },
//       { code: "0105", name: "West Branch" }
//     ]);
    
//     // Load existing shifts from API
//     loadExistingShifts();
//   }, [credentials]);

//   // Load existing shifts from API
//   const loadExistingShifts = async () => {
//     try {
//       // In a real app, you would fetch from your API
//       // For now, we'll use sample data
//       const sampleShifts = [
//         { Code: "MORN", Name: "Morning Shift" },
//         { Code: "EVEN", Name: "Evening Shift" },
//         { Code: "NIGHT", Name: "Night Shift" },
//         { Code: "GEN", Name: "General Shift" }
//       ];
//       setExistingShifts(sampleShifts);
//     } catch (error) {
//       console.error("Error loading shifts:", error);
//     }
//   };

//   // Handle HEAD field change
//   const handleHeadChange = (e) => {
//     const { name, value } = e.target;
//     setHead({ ...head, [name]: value });
//   };

//   // Handle detail row field change
//   const handleDetailChange = (index, e) => {
//     const { name, value, type, checked } = e.target;
//     const updated = [...details];
//     updated[index][name] = type === "checkbox" ? (checked ? "true" : "false") : value;
//     setDetails(updated);
//   };

//   // Load shift details when a shift is selected
//   const handleShiftSelect = async (shiftCode) => {
//     if (!shiftCode) {
//       resetForm();
//       return;
//     }
    
//     const shift = existingShifts.find(s => s.Code === shiftCode);
//     if (shift) {
//       setSelectedShift(shiftCode);
//       setIsEditing(true);
      
//       try {
//         // Fetch shift details from API
//         setLoading(true);
        
//         // In a real app, you would fetch from your API
//         // For now, we'll use sample data based on shift code
//         const sampleDetails = daysOfWeek.map(day => ({
//           Day: day,
//           OnDutyTime: shift.Code === "MORN" ? "08:30" : shift.Code === "EVEN" ? "14:00" : "22:00",
//           OffDutyTime: shift.Code === "MORN" ? "16:30" : shift.Code === "EVEN" ? "22:00" : "06:00",
//           BeginningIn: shift.Code === "MORN" ? "09:30" : shift.Code === "EVEN" ? "15:00" : "23:00",
//           EndingIn: shift.Code === "MORN" ? "10:30" : shift.Code === "EVEN" ? "16:00" : "00:00",
//           BeginningOut: shift.Code === "MORN" ? "14:30" : shift.Code === "EVEN" ? "20:00" : "04:00",
//           EndingOut: shift.Code === "MORN" ? "17:30" : shift.Code === "EVEN" ? "23:00" : "07:00",
//           BreakStart: shift.Code === "MORN" ? "12:30" : shift.Code === "EVEN" ? "18:00" : "02:00",
//           BreakEnd: shift.Code === "MORN" ? "13:15" : shift.Code === "EVEN" ? "18:45" : "02:45",
//           isRestDay: day === "Sunday" ? "true" : "false",
//           ShiftMore: "Same Day",
//           ShiftCode: shift.Code
//         }));
        
//         setHead(prev => ({ 
//           ...prev, 
//           Code: shift.Code, 
//           Name: shift.Name,
//           IsActive: "true" // Default value, you would get this from API
//         }));
        
//         setDetails(sampleDetails);
//       } catch (error) {
//         console.error("Error loading shift details:", error);
//         alert("Error loading shift details");
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   // Insert new shift
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!head.Code || !head.Name) {
//       alert("Shift Code and Name are required!");
//       return;
//     }
    
//     // Check if shift code already exists
//     if (existingShifts.some(shift => shift.Code === head.Code) && !isEditing) {
//       alert("Shift Code already exists. Please use a different code.");
//       return;
//     }
    
//     setLoading(true);

//     try {
//       // Update ShiftCode in all details
//       const updatedDetails = details.map(detail => ({
//         ...detail,
//         ShiftCode: head.Code
//       }));

//       const payload = {
//         head: {
//           tableName: "HRMSShift",
//           data: {
//             ...head,
//             IsActive: head.IsActive === "true" ? 1 : 0
//           }
//         },
//         details: updatedDetails.map((row) => ({
//           tableName: "HRMSShiftTimeTable",
//           data: {
//             ...row,
//             isRestDay: row.isRestDay === "true" ? 1 : 0
//           }
//         })),
//         selectedBranch: head.offcode
//       };

//       const response = await axios.post(
//         "http://localhost:8081/api/insert-SThead-det",
//         payload
//       );

//       if (response.data.success) {
//         setSuccessMessage("Shift saved successfully!");
//         setTimeout(() => setSuccessMessage(""), 5000);
//         // Add the new shift to existing shifts if it's new
//         if (!isEditing) {
//           setExistingShifts([...existingShifts, { Code: head.Code, Name: head.Name }]);
//         }
//         setIsEditing(false);
//       } else {
//         alert("Error: " + (response.data.error || "Unknown error"));
//       }
//     } catch (err) {
//       console.error("Insert failed:", err);
//       alert("Error saving shift data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Update shift using your update route
//   const handleUpdate = async () => {
//     if (!head.Code) {
//       alert("Please select a shift to update");
//       return;
//     }

//     setLoading(true);
//     try {
//       // First update the head (HRMSShift)
//       const headPayload = {
//         tableName: "HRMSShift",
//         data: {
//           ...head,
//           IsActive: head.IsActive === "true" ? 1 : 0
//         },
//         where: { Code: head.Code },
//         loginUser: credentials?.username || "system"
//       };

//       const headResponse = await axios.post(
//         "http://localhost:8081/api/update-table-data",
//         headPayload
//       );

//       if (!headResponse.data.success) {
//         throw new Error(headResponse.data.error || "Failed to update shift head");
//       }

//       // Then update each detail row (HRMSShiftTimeTable)
//       for (const row of details) {
//         const detailPayload = {
//           tableName: "HRMSShiftTimeTable",
//           data: {
//             ...row,
//             isRestDay: row.isRestDay === "true" ? 1 : 0,
//             ShiftCode: head.Code
//           },
//           where: { ShiftCode: head.Code, Day: row.Day },
//           loginUser: credentials?.username || "system"
//         };

//         const detailResponse = await axios.post(
//           "http://localhost:8081/api/update-table-data",
//           detailPayload
//         );

//         if (!detailResponse.data.success) {
//           console.warn(`Failed to update detail for day ${row.Day}:`, detailResponse.data.error);
//         }
//       }

//       setSuccessMessage("Shift updated successfully!");
//       setTimeout(() => setSuccessMessage(""), 5000);
      
//       // Refresh the existing shifts list
//       loadExistingShifts();
      
//     } catch (err) {
//       console.error("Update failed:", err);
//       alert("Error updating shift: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset form
//   const resetForm = () => {
//     setHead({
//       Code: "",
//       Name: "",
//       IsActive: "true",
//       offcode: "",
//       createdby: credentials?.username || "",
//       createdate: new Date().toISOString().split("T")[0],
//     });
//     setDetails(daysOfWeek.map(day => ({
//       Day: day,
//       OnDutyTime: "08:30",
//       OffDutyTime: "16:30",
//       BeginningIn: "09:30",
//       EndingIn: "10:30",
//       BeginningOut: "14:30",
//       EndingOut: "17:30",
//       BreakStart: "12:30",
//       BreakEnd: "13:15",
//       isRestDay: "false",
//       ShiftMore: "Same Day",
//       ShiftCode: ""
//     })));
//     setSelectedShift(null);
//     setIsEditing(false);
//   };

//   return (
//     <div className="voucher-container">
//       <div className="header-section">
//         <h2><FaUserClock /> Shift & Shift Timing</h2>
//         <div className="accent-line"></div>
//       </div>

//       {successMessage && (
//         <div className="success-message">
//           <FaCheckCircle /> {successMessage}
//         </div>
//       )}

//       {loading && <div className="loading-overlay">Processing...</div>}

//       <form onSubmit={handleSubmit} className="voucher-form glassmorphism">
//         {/* HEAD Section */}
//         <div className="form-section">
//           <h3><FaReceipt /> Shift Information</h3>
          
//           <div className="form-row">
//             <div className="form-group">
//               <label><FaFileAlt /> Select Shift</label>
//               <div className="input-with-icon">
//                 <FaFileAlt className="input-icon" />
//                 <select
//                   value={selectedShift || ""}
//                   onChange={(e) => handleShiftSelect(e.target.value)}
//                   className="modern-input"
//                 >
//                   <option value="">-- Select Existing Shift --</option>
//                   {existingShifts.map(shift => (
//                     <option key={shift.Code} value={shift.Code}>
//                       {shift.Code} - {shift.Name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
            
//             <div className="form-group">
//               <label><FaFileAlt /> Shift Code *</label>
//               <div className="input-with-icon">
//                 <FaFileAlt className="input-icon" />
//                 <input
//                   type="text"
//                   name="Code"
//                   value={head.Code}
//                   onChange={handleHeadChange}
//                   className="modern-input"
//                   required
//                   disabled={isEditing}
//                 />
//               </div>
//             </div>
            
//             <div className="form-group">
//               <label><FaFileAlt /> Shift Name *</label>
//               <div className="input-with-icon">
//                 <FaFileAlt className="input-icon" />
//                 <input
//                   type="text"
//                   name="Name"
//                   value={head.Name}
//                   onChange={handleHeadChange}
//                   className="modern-input"
//                   required
//                 />
//               </div>
//             </div>
//           </div>
          
//           <div className="form-row">
//             <div className="form-group">
//               <label><FaCheckCircle /> Active</label>
//               <div className="input-with-icon">
//                 <FaCheckCircle className="input-icon" />
//                 <select
//                   name="IsActive"
//                   value={head.IsActive}
//                   onChange={handleHeadChange}
//                   className="modern-input"
//                 >
//                   <option value="true">Yes</option>
//                   <option value="false">No</option>
//                 </select>
//               </div>
//             </div>
            
//             <div className="form-group">
//               <label><FaCodeBranch /> Branch</label>
//               <div className="input-with-icon">
//                 <FaCodeBranch className="input-icon" />
//                 <select
//                   name="offcode"
//                   value={head.offcode}
//                   onChange={handleHeadChange}
//                   className="modern-input"
//                 >
//                   <option value="">Select Branch</option>
//                   {branches.map(branch => (
//                     <option key={branch.code} value={branch.code}>
//                       {branch.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
            
//             <div className="form-group">
//               <label><FaReceipt /> Created By</label>
//               <div className="input-with-icon">
//                 <FaReceipt className="input-icon" />
//                 <input
//                   type="text"
//                   name="createdby"
//                   value={head.createdby}
//                   className="modern-input"
//                   readOnly
//                 />
//               </div>
//             </div>
//           </div>
          
//           <div className="form-row">
//             <div className="form-group">
//               <label><FaCalendarAlt /> Create Date</label>
//               <div className="input-with-icon">
//                 <FaCalendarAlt className="input-icon" />
//                 <input
//                   type="date"
//                   name="createdate"
//                   value={head.createdate}
//                   className="modern-input"
//                   readOnly
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* DETAILS Section */}
//         <div className="form-section">
//           <div className="section-header">
//             <h3><FaClock /> Shift Timetable</h3>
//           </div>
          
//           <div className="details-container shift-details">
//             <div className="details-header shift-header">
//               <div>Day</div>
//               <div>On Duty</div>
//               <div>Off Duty</div>
//               <div>Beginning In</div>
//               <div>Ending In</div>
//               <div>Beginning Out</div>
//               <div>Ending Out</div>
//               <div>Break Start</div>
//               <div>Break End</div>
//               <div>Rest Day</div>
//               <div>Shift More</div>
//             </div>
            
//             {details.map((row, idx) => (
//               <div key={idx} className="detail-row shift-row">
//                 <div className="day-cell">{row.Day}</div>
                
//                 <input
//                   type="time"
//                   name="OnDutyTime"
//                   value={row.OnDutyTime}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <input
//                   type="time"
//                   name="OffDutyTime"
//                   value={row.OffDutyTime}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <input
//                   type="time"
//                   name="BeginningIn"
//                   value={row.BeginningIn}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <input
//                   type="time"
//                   name="EndingIn"
//                   value={row.EndingIn}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <input
//                   type="time"
//                   name="BeginningOut"
//                   value={row.BeginningOut}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <input
//                   type="time"
//                   name="EndingOut"
//                   value={row.EndingOut}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <input
//                   type="time"
//                   name="BreakStart"
//                   value={row.BreakStart}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <input
//                   type="time"
//                   name="BreakEnd"
//                   value={row.BreakEnd}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input time-input"
//                 />
                
//                 <div className="checkbox-cell">
//                   <input
//                     type="checkbox"
//                     name="isRestDay"
//                     checked={row.isRestDay === "true"}
//                     onChange={(e) => handleDetailChange(idx, e)}
//                     className="rest-day-checkbox"
//                   />
//                 </div>
                
//                 <select
//                   name="ShiftMore"
//                   value={row.ShiftMore}
//                   onChange={(e) => handleDetailChange(idx, e)}
//                   className="modern-input shift-more-select"
//                 >
//                   <option value="Same Day">Same Day</option>
//                   <option value="Next Day">Next Day</option>
//                 </select>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="form-actions">
//           <button type="submit" className="btn save" disabled={loading}>
//             {loading ? "Processing..." : <><FaSave /> {isEditing ? "Save Changes" : "Save Shift"}</>}
//           </button>
//           <button type="button" className="btn update" onClick={handleUpdate} disabled={loading || !isEditing}>
//             {loading ? "Processing..." : <><FaEdit /> Update Shift</>}
//           </button>
//           <button type="button" className="btn cancel" onClick={resetForm} disabled={loading}>
//             <FaSync /> {isEditing ? "Cancel Edit" : "Reset Form"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ShiftManagement;