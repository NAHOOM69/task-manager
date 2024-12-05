import React from 'react';

interface DialogDescriptionProps {
  description: string;
}

const DialogDescription: React.FC<DialogDescriptionProps> = ({ description }) => {
  return (
    <div className="mt-2 text-sm text-gray-500">
      {description}
    </div>
  );
};

export default DialogDescription;
