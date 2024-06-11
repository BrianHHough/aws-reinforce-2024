"use client";
import React, { useState } from 'react';

const SSTUpload: React.FC = () => {
  const [fileUrl, setFileUrl] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fileInput = (e.target as HTMLFormElement).file as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/presigned-url', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFileUrl(data.url);
        // Remove the navigation line
        // window.location.href = data.url;
      } else {
        console.error('File upload failed');
      }
    }
  };

  return (
    <main>
      <h1>Testing upload to S3 without presigned URL</h1>
      <br />
      <form onSubmit={handleSubmit}>
        <input name="file" type="file" accept="image/png, image/jpeg" required />
        <button type="submit">Upload</button>
      </form>
      {fileUrl && (
        <p>File uploaded successfully: <a href={fileUrl} target="_blank" rel="noopener noreferrer">{fileUrl}</a></p>
      )}
    </main>
  );
};

export default SSTUpload;
