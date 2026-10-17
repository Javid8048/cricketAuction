import { Team, Player } from '../types';

/**
 * Initial empty state for tournament:
 * All teams and players removed so tournament starts completely fresh.
 * Admin can create teams and set their custom login credentials.
 * Players register publicly or are added by admin.
 */
export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_PLAYERS: Player[] = [];
