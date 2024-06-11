import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TableName || '';
const BUCKET_NAME = process.env.BucketName || '';

interface Photo {
  id: string;
  url: string;
  description: string;
  order: number;
}

export async function GET(req: NextRequest) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#id = :idValue AND #order BETWEEN :startOrder AND :endOrder',
      ExpressionAttributeNames: {
        '#id': 'id',
        '#order': 'order',
      },
      ExpressionAttributeValues: {
        ':idValue': { S: 'gallery' },
        ':startOrder': { N: '0' },
        ':endOrder': { N: '30' },
      },
    });

    const response = await dynamoDb.send(command);

    const photos = await Promise.all((response.Items || []).map(async (item) => {
      const key = item.imageUrl.S;

      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });

      return {
        id: item.id.S!,
        url,
        description: item.description.S!,
        order: Number(item.order.N!), // Convert the order to a number
      };
    }));

    // Sort photos by order just in case
    // photos.sort((a, b) => a.order - b.order);

    // console.log('photos', photos)

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ message: 'Failed to fetch photos', error }, { status: 500 });
  }
}

// export default function handler(req: NextRequest) {
//   if (req.method === 'GET') {
//     return GET(req);
//   } else {
//     return NextResponse.json({ message: `Method ${req.method} Not Allowed` }, { status: 405 });
//   }
// }
