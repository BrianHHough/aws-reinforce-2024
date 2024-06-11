"use client";
import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import styled from '@emotion/styled';
import Link from 'next/link';

interface Photo {
  id: string;
  url: string;
  description: string;
  order: number;
}

const GalleryContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
`;

const PhotoCard = styled.div`
  width: 300px;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPhotos = async (startKey: Record<string, any> | undefined = undefined) => {
    try {
      const response = await fetch('/api/photos/list');
      const data = await response.json();
      console.log('data', data);

      if (response.ok) {
        // Filter out duplicates
        const uniquePhotos = data.photos.filter((newPhoto: Photo) =>
          !photos.some(photo => photo.id === newPhoto.id)
        );

        console.log('data.photos', data.photos)

        // setPhotos((prevPhotos) => [...prevPhotos, ...uniquePhotos]);
        setPhotos(data.photos);
        setHasMore(data.photos.length > 0);
      } else {
        console.error('Error fetching photos:', data.message);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  return (
    <InfiniteScroll
      dataLength={photos.length}
      next={() => fetchPhotos()}
      hasMore={hasMore}
      loader={!photos.length && <h4>Loading...</h4>}
      endMessage={
        <Link href="/admin">
          <p style={{ textAlign: 'center' }}>No photos found... Let&rsquo;s upload a photo 👀</p>
        </Link>
      }
    >
      <GalleryContainer>
        {photos.map((photo) => (
          <PhotoCard key={photo.id}>
            <img src={photo.url} alt={photo.description} />
          </PhotoCard>
        ))}
      </GalleryContainer>
    </InfiniteScroll>
  );
};

export default Gallery;
