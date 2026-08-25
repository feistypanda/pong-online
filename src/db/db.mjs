
import { MongoClient } from 'mongodb';

const dbURI = 'mongodb://127.0.0.1:52258/?directConnection=true';

let client;
let database;

async function _connectToDatabase () {

	if (database) return database;

	try {
		client = new MongoClient(dbURI);

		// Conenct client
		await client.connect();

		// Get DB
		database = client.db("pongDB");

		return database;
	} catch (e) {
		throw(e);
	}
}

let connect;

export async function connectToDatabase () {
	connect ??= _connectToDatabase()
	return await connect;
}

export async function closeDatabaseConnection () {
	if (client) await client.close();
}

export function getCollection (collectionName) {
	if (!database) throw new Error("Database not connected.");

  	return database.collection(collectionName);
}

