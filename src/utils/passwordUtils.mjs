
import bcryptjs from 'bcryptjs';

const saltRounds = 10;

export async function hash (plaintext) {
	return await bcryptjs.hash(plaintext, saltRounds);
}

export async function compare (pass, hash) {
	return await bcryptjs.compare(pass, hash);
}