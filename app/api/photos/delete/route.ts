import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME || '';
const BUCKET_NAME = process.env.BUCKET_NAME || '';

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  console.log('Received delete request for id:', id);

  if (!id) {
    return NextResponse.json({ message: 'ID is required' }, { status: 400 });
  }

  const deleteDynamoDbParams = {
    TableName: TABLE_NAME,
    Key: {
      id: { S: id }
    }
  };

  const deleteS3Params = {
    Bucket: BUCKET_NAME,
    Key: id,
  };

  try {
    await Promise.all([
      dynamoDb.send(new DeleteItemCommand(deleteDynamoDbParams)),
      s3.send(new DeleteObjectCommand(deleteS3Params))
    ]);

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete operation failed:', error);
    return NextResponse.json({ message: 'Failed to delete photo', error: error }, { status: 500 });
  }
}

// export default function handler(req: NextRequest) {
//   switch (req.method) {
//     case 'DELETE':
//       return DELETE(req);
//     case 'GET':
//       return GET(req);
//     default:
//       return NextResponse.json({ message: `Method ${req.method} Not Allowed` }, { status: 405 });
//   }
// }
