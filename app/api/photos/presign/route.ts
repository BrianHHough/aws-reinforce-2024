import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = process.env.BucketName;

const getQueryParams = (searchParams: URLSearchParams, keys: string[]) => {
  return keys.reduce((acc, key) => {
    acc[key] = searchParams.get(key);
    return acc;
  }, {} as { [key: string]: string | null });
};

export async function GET(req: NextRequest) {
  const { fileName, fileType } = getQueryParams(req.nextUrl.searchParams, ['fileName', 'fileType']);
  console.log('Received query params:', { fileName, fileType });

  if (!fileName || !fileType) {
    return NextResponse.json({ message: 'File name and type are required' }, { status: 400 });
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME!,
    Key: fileName!,
    ContentType: fileType!,
  });

  console.log('command', command)

  try {
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    console.log('Generated presigned URL:', presignedUrl);
    return NextResponse.json({ presignedUrl });
  } catch (error) {
    console.error('Error creating pre-signed URL', error);
    return NextResponse.json({ message: 'Could not create pre-signed URL', error }, { status: 500 });
  }
}

// export default function handler(req: NextRequest) {
//   if (req.method === 'GET') {
//     return GET(req);
//   } else {
//     return NextResponse.json({ message: `Method ${req.method} Not Allowed` }, { status: 405 });
//   }
// }
