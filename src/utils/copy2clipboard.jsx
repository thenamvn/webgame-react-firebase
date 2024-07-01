import { useState } from 'react';

// Custom hook for copying text to clipboard and managing tooltip visibility
export const useCopyToClipboard = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show tooltip on successful copy
        setShowTooltip(true);
        // Hide tooltip after 2 seconds
        setTimeout(() => setShowTooltip(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return { copyToClipboard, showTooltip };
};