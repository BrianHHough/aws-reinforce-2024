import Image from "next/image";
import Head from "next/head";
import { Metadata } from 'next';
import Container from "./components/Container";
 
export const metadata: Metadata = {
  title: {
    template: '%s | Serverless Photo Gallery',
    default: 'Serverless Photo Gallery',
  },
  description: 'A fun photo gallery to feature your favorite photos using serverless technology on AWS',
  metadataBase: new URL('https://techstackplaybook.com'),
};

export default function Home() {
  return (
    <>
      <Container/>
    </>
  );
}
