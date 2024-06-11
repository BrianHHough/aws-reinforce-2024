import React, { CSSProperties, useCallback, useState } from 'react';
import { useDropzone, FileRejection, FileError } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Define styles as constants
const thumbsContainer: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 16,
};

const thumbContainer: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '0px 5px',
};

const thumb: CSSProperties = {
  display: 'inline-flex',
  borderRadius: 2,
  border: '1px solid #eaeaea',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box',
};

const thumbInner: CSSProperties = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden',
};

const img: CSSProperties = {
  display: 'block',
  width: 'auto',
  height: '100%',
};

const photoOrderContainer: CSSProperties = {
  margin: '5px 0px',
  fontSize: '13px',
};

const rejectedContainer: CSSProperties = {
  marginTop: '40px',
};

const deleteButton: CSSProperties = {
  position: 'absolute',
  marginRight: "-120px",
  backgroundColor: 'coral',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: 20,
  height: 20,
  cursor: 'pointer',
  fontSize: "10px"
};

const submitButton: CSSProperties = {
  background: 'linear-gradient(to right, #00c6ff, #0072ff)',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  margin: "30px"
}

interface ExtendedFile extends File {
  preview?: string;
  description?: string;
  path?: string;
}

interface ImageDropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onFilesAdded }) => {
  const [files, setFiles] = useState<ExtendedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const mappedFiles = acceptedFiles.map(file => {
      const extendedFile: ExtendedFile = {
        ...file,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        preview: URL.createObjectURL(file),
        description: '', // initial empty description
      };
      return extendedFile;
    });
    setFiles(prevFiles => [...prevFiles, ...mappedFiles]);
    // Remove the call to onFilesAdded since it's redundant
    // onFilesAdded(acceptedFiles);
  }, []);

  const handleDescriptionChange = (fileIndex: number, description: string) => {
    const updatedFiles = files.map((item, index) => {
      if (index === fileIndex) {
        return { ...item, description };
      }
      return item;
    });
    setFiles(updatedFiles);
  };

  const handleDelete = (fileIndex: number) => {
    const updatedFiles = files.filter((_, index) => index !== fileIndex);
    setFiles(updatedFiles);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(files);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFiles(items);
  };

  const handleSubmit = async () => {
    const uploadPromises = files.map(async file => {
      try {
        // Log file details
        console.log('Uploading file:', file);
  
        // Create a fetch request directly for each file
        const response = await fetch('/api/photos/puts3', {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'Content-Disposition': `attachment; filename="${file.name}"`,
          },
          body: file,
        });
  
        if (!response.ok) {
          throw new Error(`Error uploading file: ${response.statusText}`);
        }
  
        const { url: imageUrl } = await response.json();
  
        // Extract the key from the URL
        const key = new URL(imageUrl).pathname.substring(1);
        console.log('key', key)
  
        // Store file metadata in the database
        await fetch('/api/photos/upload', {
          method: 'POST',
          body: JSON.stringify({
            id: file.name,
            order: files.indexOf(file),
            key,
            description: file.description,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    });
  
    try {
      await Promise.all(uploadPromises);
      alert('Files uploaded successfully!');
    } catch (error) {
      alert('Failed to upload files: ' + error);
    }
  };
  
  
  
  
  // Define accept as a string or array of strings
  const accept = {
    'image/jpeg': ['.jpeg', '.jpg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
  };

  const maxSize = 10 * 1024 * 1024; // 10 MB

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
  });

  const fileRejectionItems = fileRejections.map(({ file, errors }: FileRejection) => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
      <ul>
        {errors.map((e: FileError) => (
          <li key={e.code}>{e.message}</li>
        ))}
      </ul>
    </li>
  ));

  const thumbs = files.map((file, index) => (
    <Draggable key={file.preview} draggableId={file.preview!} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            ...thumbContainer,
            boxShadow: snapshot.isDragging ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
          }}
        >
          <button
                style={deleteButton}
                onClick={() => handleDelete(index)}
              >
                  X
              </button>
          <div style={thumb}>
            <div style={thumbInner}>
              <img
                src={file.preview}
                style={img}
                alt="preview"
                onLoad={() => URL.revokeObjectURL(file.preview ?? '')} // Clean up after loading
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Enter description"
            value={file.description}
            onChange={e => handleDescriptionChange(index, e.target.value)}
          />
          <div style={photoOrderContainer}>Photo #{index + 1}</div>
        </div>
      )}
    </Draggable>
  ));

  return (
    <section className="container">
      <div {...getRootProps()} style={{ border: '2px dashed #007bff', padding: '20px', textAlign: 'center' }}>
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the images here ...</p> : <p>Drag and drop some images here, or click to select images</p>}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="thumbnails" direction="horizontal">
          {(provided) => (
            <aside ref={provided.innerRef} {...provided.droppableProps} style={thumbsContainer}>
              {thumbs}
              {provided.placeholder}
            </aside>
          )}
        </Droppable>
      </DragDropContext>

      <button style={submitButton} onClick={handleSubmit}>
        Submit
      </button>
    </section>
  );
};

export default ImageDropzone;
