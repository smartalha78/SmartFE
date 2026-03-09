// src/components/Portal.js
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children, portalId = 'modal-portal' }) => {
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    // Create or get the portal element
    let element = document.getElementById(portalId);
    if (!element) {
      element = document.createElement('div');
      element.id = portalId;
      document.body.appendChild(element);
    }
    setPortalElement(element);

    // Cleanup
    return () => {
      if (element && element.childNodes.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, [portalId]);

  if (!portalElement) return null;

  return createPortal(children, portalElement);
};

export default Portal;