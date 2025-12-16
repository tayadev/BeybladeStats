export const STARTING_ELO = 100;
export const LOSS_PERCENTAGE = 0.08;
export const WIN_BONUS = 2;
export const TOURNAMENT_BONUS_PERCENTAGE = 0.08;
export const INACTIVITY_DAYS = 60;
export const INACTIVITY_PENALTY_PERCENTAGE = 0.08;

export function calculateMatchElo(winnerElo: number, loserElo: number): {
  newWinnerElo: number;
  newLoserElo: number;
  pointsTransferred: number;
} {
  const pointsLost = Math.floor(loserElo * LOSS_PERCENTAGE);
  const newLoserElo = loserElo - pointsLost;
  const newWinnerElo = winnerElo + pointsLost + WIN_BONUS;

  return {
    newWinnerElo,
    newLoserElo,
    pointsTransferred: pointsLost,
  };
}

export function calculateTournamentBonus(currentElo: number): number {
  return Math.floor(currentElo * TOURNAMENT_BONUS_PERCENTAGE);
}

export function calculateInactivityPenalty(
  currentElo: number,
  lastMatchTimestamp: number,
  currentTimestamp: number,
  seasonEndTimestamp: number
): number {
  const effectiveCurrentTime = Math.min(currentTimestamp, seasonEndTimestamp);
  const daysSinceLastMatch = (effectiveCurrentTime - lastMatchTimestamp) / (1000 * 60 * 60 * 24);

  if (daysSinceLastMatch < INACTIVITY_DAYS) {
    return 0;
  }

  const periodsInactive = Math.floor(daysSinceLastMatch / INACTIVITY_DAYS);
  let penalizedElo = currentElo;

  for (let i = 0; i < periodsInactive; i++) {
    penalizedElo = penalizedElo * (1 - INACTIVITY_PENALTY_PERCENTAGE);
  }

  return Math.floor(currentElo - penalizedElo);
}
