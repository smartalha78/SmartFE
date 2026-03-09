// services/pdfService.js
import jsPDF from "jspdf";
import "jspdf-autotable";

class PDFService {
  constructor() {
    this.doc = null;
    this.pageWidth = 0;
    this.cursorY = 40;
    this.margin = 40;
    this.pageHeight = 0;
  }

  /**
   * Generate employee PDF
   * @param {Object} employee - Employee data
   * @param {Object} relatedData - Related data (academic, employment, etc.)
   * @param {Object} options - Options like company name, logo, etc.
   * @returns {jsPDF} - jsPDF instance
   */
  generateEmployeePDF(employee, relatedData = {}, options = {}) {
    // Initialize PDF
    this.doc = new jsPDF({ unit: "pt", format: "a4" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.cursorY = 40;

    const {
      companyName = "Company Name",
      companyAddress = "",
      companyLogo = null,
      showWatermark = true,
      watermark = "CONFIDENTIAL"
    } = options;

    // Add watermark if enabled
    if (showWatermark) {
      this.addWatermark(watermark);
    }

    // Add header
    this.addHeader(companyName, companyAddress, employee);

    // Add employee picture if exists
    if (employee.pictureimg || employee.picture || employee.pictureURL) {
      this.addEmployeePicture(employee);
    }

    // Basic Information
    this.addSectionTitle("Basic Information");
    this.addEmployeeBasicInfo(employee);

    // Contact Information
    if (employee.Mobile || employee.Email || employee.P_Address || employee.H_Address) {
      this.addSectionTitle("Contact Information");
      this.addContactInfo(employee);
    }

    // Attendance Specification
    if (employee.offdayBonusAllow !== undefined || 
        employee.AutoAttendanceAllow !== undefined || 
        employee.OverTimeAllow !== undefined) {
      this.addSectionTitle("Attendance Specification");
      this.addAttendanceSpec(employee);
    }

    // Related data tables
    this.addRelatedTable("Academic Information", relatedData.academic || [], "HRMSEmployeeAcademicInfo", this.getAcademicColumns.bind(this));
    this.addRelatedTable("Employment History", relatedData.employment || [], "HRMSEmployementHistory", this.getEmploymentColumns.bind(this));
    this.addRelatedTable("Allowances", relatedData.allowances || [], "HRMSEmployeeGrantAllowance", this.getAllowanceColumns.bind(this));
    this.addRelatedTable("Deductions", relatedData.deductions || [], "HRMSEmployeeGrantDeduction", this.getDeductionColumns.bind(this));
    this.addRelatedTable("Family Details", relatedData.family || [], "HRMSEmployeeFamilyDet", this.getFamilyColumns.bind(this));

    // Add footer
    this.addFooter();

    return this.doc;
  }

  /**
   * Add watermark to PDF
   */
  addWatermark(text) {
    this.doc.saveGraphicsState();
    this.doc.setGState(new this.doc.GState({ opacity: 0.1 }));
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(60);
    this.doc.setFont("helvetica", "bold");
    
    // Add diagonal watermark
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;
    
    this.doc.text(text, centerX, centerY, {
      align: "center",
      angle: 45
    });
    
    this.doc.restoreGraphicsState();
  }

  /**
   * Add header to PDF
   */
  addHeader(companyName, companyAddress, employee) {
    // Company name
    this.doc.setFontSize(20);
    this.doc.setTextColor(139, 92, 246); // Purple color
    this.doc.setFont("helvetica", "bold");
    this.doc.text(companyName, this.margin, this.cursorY);
    
    // Company address
    if (companyAddress) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(companyAddress, this.margin, this.cursorY + 15);
    }
    
    // Report title
    this.doc.setFontSize(16);
    this.doc.setTextColor(50, 50, 50);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(
      `Employee Report - ${employee.Name || "N/A"}`,
      this.margin,
      this.cursorY + 40
    );
    
    // Employee code and date
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      `Employee Code: ${employee.Code || "N/A"} | Report Date: ${new Date().toLocaleDateString()}`,
      this.margin,
      this.cursorY + 55
    );
    
    this.cursorY += 70;
  }

  /**
   * Add employee picture to PDF
   */
  addEmployeePicture(employee) {
    try {
      const picBase64 = employee.pictureimg || employee.picture || employee.pictureURL;
      if (!picBase64) return;
      
      let dataUrl = picBase64;
      if (!picBase64.startsWith("data:")) {
        dataUrl = "data:image/jpeg;base64," + picBase64;
      }
      
      const imgW = 100;
      const imgH = 100;
      const x = this.pageWidth - imgW - this.margin;
      
      this.doc.addImage(dataUrl, "JPEG", x, this.cursorY - 60, imgW, imgH);
      
      // Add border around picture
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(1);
      this.doc.rect(x - 2, this.cursorY - 62, imgW + 4, imgH + 4);
    } catch (err) {
      console.warn("Could not add image to PDF:", err);
    }
  }

  /**
   * Add section title to PDF
   */
  addSectionTitle(title) {
    // Check if we need a new page
    if (this.cursorY > this.pageHeight - 100) {
      this.doc.addPage();
      this.cursorY = 40;
    }
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(139, 92, 246);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin, this.cursorY);
    
    // Add underline
    this.doc.setDrawColor(139, 92, 246);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.cursorY + 5, this.margin + 200, this.cursorY + 5);
    
    this.cursorY += 20;
  }

  /**
   * Add basic employee information table
   */
  addEmployeeBasicInfo(employee) {
    const basicRows = [
      ["Code", employee.Code || "N/A"],
      ["Name", employee.Name || "N/A"],
      ["Father's Name", employee.FName || "N/A"],
      ["Last Name", employee.LName || "N/A"],
      ["Department", employee.DepartmentName || employee.DepartmentCode || "N/A"],
      ["Designation", employee.DesignationName || employee.DesignationCode || "N/A"],
      ["Appointment Date", this.formatDate(employee.AppointmentDate)],
      ["Joining Date", this.formatDate(employee.JoiningDate)],
      ["Basic Pay", employee.BasicPay ? `$${employee.BasicPay}` : "N/A"],
      ["Employment Status", employee.EmploymentStatus || "N/A"],
      ["Gender", employee.Gender || "N/A"],
      ["Marital Status", employee.MaritalStatus || "N/A"],
      ["Date of Birth", this.formatDate(employee.DOB)],
      ["CNIC", employee.CNIC || "N/A"],
      ["Nationality", employee.Nationality || "N/A"]
    ].filter(row => row[1] !== "N/A" && row[1] !== "");

    this.doc.autoTable({
      startY: this.cursorY,
      head: [["Field", "Value"]],
      body: basicRows,
      theme: "grid",
      styles: { 
        fontSize: 9,
        cellPadding: 8,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 150 },
        1: { cellWidth: 300 }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.cursorY = this.doc.lastAutoTable.finalY + 15;
  }

  /**
   * Add contact information table
   */
  addContactInfo(employee) {
    const contactRows = [
      ["Mobile", employee.Mobile || "N/A"],
      ["Email", employee.Email || "N/A"],
      ["Phone", employee.Phone || "N/A"],
      ["Permanent Address", employee.P_Address || "N/A"],
      ["Permanent City", employee.P_City || "N/A"],
      ["Home Address", employee.H_Address || "N/A"],
      ["Home City", employee.H_City || "N/A"]
    ].filter(row => row[1] !== "N/A" && row[1] !== "");

    if (contactRows.length === 0) return;

    this.doc.autoTable({
      startY: this.cursorY,
      head: [["Field", "Value"]],
      body: contactRows,
      theme: "grid",
      styles: { 
        fontSize: 9,
        cellPadding: 8,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 150 },
        1: { cellWidth: 300 }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.cursorY = this.doc.lastAutoTable.finalY + 15;
  }

  /**
   * Add attendance specification table
   */
  addAttendanceSpec(employee) {
    const specRows = [
      ["Off Day Bonus Allow", this.formatBoolean(employee.offdayBonusAllow)],
      ["Auto Attendance", this.formatBoolean(employee.AutoAttendanceAllow)],
      ["Over Time Allow", this.formatBoolean(employee.OverTimeAllow)],
      ["Punctuality Allow", this.formatBoolean(employee.PunctuailityAllown)],
      ["Early/Late Deduction", this.formatBoolean(employee.EarlyLateAllow)],
      ["Early/Late Exemptions", employee.EarlyLateNoofDeductionExempt || "0"]
    ].filter(row => row[1] !== "N/A");

    this.doc.autoTable({
      startY: this.cursorY,
      head: [["Field", "Value"]],
      body: specRows,
      theme: "grid",
      styles: { 
        fontSize: 9,
        cellPadding: 8,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 200 },
        1: { cellWidth: 250 }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.cursorY = this.doc.lastAutoTable.finalY + 15;
  }

  /**
   * Add related data table
   */
  addRelatedTable(title, data, tableKey, columnExtractor) {
    if (!data || data.length === 0) return;

    // Check if we need a new page
    if (this.cursorY > this.pageHeight - 100) {
      this.doc.addPage();
      this.cursorY = 40;
    }

    this.addSectionTitle(title);

    const { columns, rows } = columnExtractor(data);

    if (columns.length === 0 || rows.length === 0) return;

    this.doc.autoTable({
      startY: this.cursorY,
      head: [columns],
      body: rows,
      theme: "grid",
      styles: { 
        fontSize: 8,
        cellPadding: 6,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.cursorY = this.doc.lastAutoTable.finalY + 15;
  }

  /**
   * Get academic columns and rows
   */
  getAcademicColumns(data) {
    const columns = ["Degree", "Institute", "Year", "Grade/Percentage"];
    const rows = data.map(item => [
      item.Description || "-",
      item.Institute || "-",
      item.Year || "-",
      item.Grade || "-"
    ]);
    return { columns, rows };
  }

  /**
   * Get employment columns and rows
   */
  getEmploymentColumns(data) {
    const columns = ["Position", "Company", "From Date", "To Date", "Experience"];
    const rows = data.map(item => [
      item.Description || "-",
      item.Company || "-",
      this.formatDate(item.FromDate),
      this.formatDate(item.ToDate),
      item.Experience || "-"
    ]);
    return { columns, rows };
  }

  /**
   * Get allowance columns and rows
   */
  getAllowanceColumns(data) {
    const columns = ["Allowance", "Amount", "Calculation Type", "Effective Date"];
    const rows = data.map(item => [
      item.AllowanceName || item.AllowancesCode || "-",
      item.Amount || "-",
      item.CalType === "1" ? "Fixed" : item.CalType === "2" ? "Percentage" : "-",
      this.formatDate(item.EffectiveDate)
    ]);
    return { columns, rows };
  }

  /**
   * Get deduction columns and rows
   */
  getDeductionColumns(data) {
    const columns = ["Deduction", "Amount", "Calculation Type", "Effective Date"];
    const rows = data.map(item => [
      item.DeductionName || item.DeductionsCode || "-",
      item.Amount || "-",
      item.CalType === "1" ? "Fixed" : item.CalType === "2" ? "Percentage" : "-",
      this.formatDate(item.EffectiveDate)
    ]);
    return { columns, rows };
  }

  /**
   * Get family columns and rows
   */
  getFamilyColumns(data) {
    const columns = ["Name", "Relation", "CNIC", "Date of Birth", "Contact"];
    const rows = data.map(item => [
      item.Name || "-",
      item.Relation || "-",
      item.CNIC || "-",
      this.formatDate(item.DOB),
      item.Contact || "-"
    ]);
    return { columns, rows };
  }

  /**
   * Add footer to PDF
   */
  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Add footer line
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(1);
      this.doc.line(this.margin, this.pageHeight - 30, this.pageWidth - this.margin, this.pageHeight - 30);
      
      // Add page number
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
        this.margin,
        this.pageHeight - 15
      );
      
      // Add company name on right side
      this.doc.text(
        "Confidential",
        this.pageWidth - this.margin - 50,
        this.pageHeight - 15
      );
    }
  }

  /**
   * Format date for PDF
   */
  formatDate(date) {
    if (!date) return "-";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleDateString();
    } catch {
      return date;
    }
  }

  /**
   * Format boolean for PDF
   */
  formatBoolean(value) {
    if (value === true || value === "true" || value === 1) return "Yes";
    if (value === false || value === "false" || value === 0) return "No";
    return "N/A";
  }

  /**
   * Save PDF to file
   */
  savePDF(doc, filename) {
    doc.save(filename);
  }

  /**
   * Get PDF blob URL
   */
  getPDFBlobUrl(doc) {
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  /**
   * Open PDF in new tab
   */
  openPDFInNewTab(doc) {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

export default new PDFService();