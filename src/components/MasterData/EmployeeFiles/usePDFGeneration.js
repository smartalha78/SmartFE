// hooks/usePDFGeneration.js
import { useState, useCallback } from 'react';
import pdfService from './pdfService';

const usePDFGeneration = (options = {}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdf, setShowPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generatePDF = useCallback((data, relatedData = {}, pdfOptions = {}) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const doc = pdfService.generateEmployeePDF(
        data,
        relatedData,
        { ...options, ...pdfOptions }
      );
      
      const url = pdfService.getPDFBlobUrl(doc);
      
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
      setShowPdf(true);
      setIsGenerating(false);
      
      return { doc, url };
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
      console.error("PDF Generation Error:", err);
      return null;
    }
  }, [options, pdfUrl]);

  const downloadPDF = useCallback((filename) => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl]);

  const closePDF = useCallback(() => {
    setShowPdf(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [pdfUrl]);

  return {
    pdfUrl,
    showPdf,
    isGenerating,
    error,
    generatePDF,
    downloadPDF,
    closePDF,
    setShowPdf
  };
};

export default usePDFGeneration;