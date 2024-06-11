import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';

const s3 = new S3Client({ region: process.env.AWSRegion });
const BUCKET_NAME = process.env.BucketName;

export async function POST(req: NextRequest) {
  try {
    // Read the file from the request body directly
    const fileContent = await req.blob();
    const buffer = Buffer.from(await fileContent.arrayBuffer());
    const fileName = req.headers.get('Content-Disposition')?.split('filename=')[1].replace(/"/g, '');

    if (!fileName) {
      return NextResponse.json({ message: 'File name is required' }, { status: 400 });
    }

    console.log('Received file:', fileName);
    console.log('File size:', buffer.length);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: req.headers.get('Content-Type') || 'application/octet-stream',
    });

    await s3.send(command);

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWSRegion}.amazonaws.com/${fileName}`;

    return NextResponse.json({ url: fileUrl }, { status: 200 });
  } catch (error) {
    console.error('Error uploading file', error);
    return NextResponse.json({ message: 'Failed to upload file', error }, { status: 500 });
  }
}
