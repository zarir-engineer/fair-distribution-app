import { ObjectId } from "mongodb";
import clientPromise from '@/lib/mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db('fair-distribution');

  if (req.method === 'GET') {
    const data = await db.collection('pros-cons').find().toArray();
    res.json(data);
  } else if (req.method === 'POST') {
    const { type, text } = req.body;
    const result = await db.collection('pros-cons').insertOne({ type, text });
    res.json(result);
  } else if (req.method === 'DELETE') {
    const { id } = req.body;
    const result = await db.collection('pros-cons').deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
