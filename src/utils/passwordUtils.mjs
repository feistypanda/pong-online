
import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hash (plaintext) {
	return await bcrypt.hash(plaintext, saltRounds);
}

export async function compare (pass, hash) {
	return await bcrypt.compare(pass, hash);
}