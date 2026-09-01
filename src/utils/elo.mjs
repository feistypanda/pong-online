
const K = 64;

export default function calculateELO (eloA, eloB, score, maxScore) {
	let scoreA = 0.5 + score[0]/maxScore/2 - score[1]/maxScore/2;
	let scoreB = 1 - scoreA;

	let exptectedA = 1/(1 + 10 ** ((eloB - eloA)/400))
	let exptectedB = 1 - exptectedA;

	let changeA = K * (scoreA - exptectedA);

	return [eloA + changeA, eloB - changeA];
}