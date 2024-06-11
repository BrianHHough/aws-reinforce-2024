import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TableName || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const { id, order, imageUrl, description } = body;

    if (!id || order === undefined || !imageUrl || description === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Generate a UUID for the ID
    const ddb_id = uuidv4();
    const partitionKey_String = "gallery"

    // Extract the key from the imageUrl
    const key = imageUrl.split('/').pop();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: { S: partitionKey_String },
        fileName: { S: id },
        order: { N: order.toString() },
        imageUrl: { S: key }, // Save only the key
        description: { S: description },
        uuid: { S: ddb_id },
      },
    };

    console.log('DynamoDB put params:', params);

    const command = new PutItemCommand(params);
    await dynamoDb.send(command);
    return NextResponse.json({ message: 'Photo uploaded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to upload photo', error);
    return NextResponse.json({ message: 'Failed to upload photo', error }, { status: 500 });
  }
}

// export default function handler(req: NextRequest) {
//   if (req.method === 'POST') {
//     return POST(req);
//   } else {
//     return NextResponse.json({ message: `Method ${req.method} Not Allowed` }, { status: 405 });
//   }
// }
