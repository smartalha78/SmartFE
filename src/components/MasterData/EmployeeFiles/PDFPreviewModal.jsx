// components/PDFPreviewModal.jsx
import React from "react";
import { FaSave, FaEye, FaTimes, FaDownload, FaPrint } from "react-icons/fa";

const PDFPreviewModal = ({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  title = "PDF Preview",
  fileName = "document.pdf",
  onDownload,
  onPrint,
  onOpenInNewTab
}) => {
  if (!isOpen || !pdfUrl) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      const printWindow = window.open(pdfUrl, '_blank');
      printWindow?.print();
    }
  };

  const handleOpenInNewTab = () => {
    if (onOpenInNewTab) {
      onOpenInNewTab();
    } else {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="pdf-preview-modal" onClick={onClose}>
      <div className="pdf-preview-content" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-preview-header">
          <h3>
            <FaDownload /> {title}
          </h3>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="pdf-preview-body">
          <iframe 
            src={pdfUrl} 
            title={title}
            className="pdf-preview-iframe"
          />
        </div>
        
        <div className="pdf-actions">
          <button 
            className="btn btn-primary"
            onClick={handleDownload}
          >
            <FaSave /> Download
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleOpenInNewTab}
          >
            <FaEye /> Open in New Tab
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handlePrint}
          >
            <FaPrint /> Print
          </button>
          
          <button 
            className="btn btn-cancel"
            onClick={onClose}
          >
            <FaTimes /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;