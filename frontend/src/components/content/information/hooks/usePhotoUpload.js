// hooks/usePhotoUpload.js
import { useRef, useState } from 'react';

export function usePhotoUpload({ errors, setErrors }) {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleChooseFile = () => fileInputRef.current.click();
  const handlePhotoClick = () => fileInputRef.current.click();

  const handleFileChange = (e, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      alert('Format non supporté. Utilisez JPEG, JPG ou PNG.');
      return;
    }

    if (errors.photo) {
      setErrors((prev) => ({ ...prev, photo: false }));
    }

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };

  return {
    fileInputRef,
    selectedImage,
    setSelectedImage,
    handleChooseFile,
    handlePhotoClick,
    handleFileChange,
  };
}
