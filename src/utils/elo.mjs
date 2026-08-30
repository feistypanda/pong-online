
const K = 32;

export default function calculateELO (eloA, eloB, winner) {
	let scoreA = +(winner === 0);
	let scoreB = 1- scoreA;
	
	let exptectedA = 1/(1 + 10 ** ((eloB - eloA)/400))
	let exptectedB = 1 - exptectedA;

	let changeA = K * (scoreA - exptectedA);

	return [eloA + changeA, eloB - changeA];
}