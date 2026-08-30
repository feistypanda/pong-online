
import { MongoClient } from 'mongodb';
import config from "../config/env.mjs";

let client;
let database;

async function _connectToDatabase () {

	if (database) return database;

	try {
		client = new MongoClient(config.db.uri);

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

