// ── Israeli Football Player Dataset ──────────────────────────────────────────
// 32 players from Israeli Ligat Ha'al, Israeli National Team, and overseas.
// Same schema as csvPlayerStore output: id, name, position, rating,
// nationality, country, club, leagueName, stats{pac,sho,pas,dri,def,phy},
// eaId (null — no FutBin ID), image (null — uses initials fallback).
//
// HOW TO ADD MORE PLAYERS:
//   1. Copy an existing entry.
//   2. Give it a unique id (e.g. 'isr_33', 'isr_34' …).
//   3. Set realistic stats: rating 60-85 for Israeli league, 75-82 for NT starters.
//   4. eaId: null means the card will show the player's initials avatar.
//      If the player has a FutBin profile, add the numeric eaId and the photo
//      will load automatically from the CDN.
// ─────────────────────────────────────────────────────────────────────────────

const ISRAELI_PLAYERS = [

  // ── Goalkeepers ─────────────────────────────────────────────────────────────
  {
    id: 'isr_1', name: 'Omri Glazer', position: 'GK', rating: 76,
    nationality: 'Israel', country: 'Israel',
    club: 'VfB Stuttgart', leagueName: 'Bundesliga',
    stats: { pac: 58, sho: 12, pas: 55, dri: 54, def: 18, phy: 72 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_2', name: 'Mahran Radi', position: 'GK', rating: 73,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 55, sho: 10, pas: 52, dri: 50, def: 16, phy: 70 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_3', name: 'Ofir Ben Zion', position: 'GK', rating: 62,
    nationality: 'Israel', country: 'Israel',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 50, sho: 8,  pas: 46, dri: 46, def: 12, phy: 62 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Centre-Backs ────────────────────────────────────────────────────────────
  {
    id: 'isr_4', name: 'Idan Nachmias', position: 'CB', rating: 74,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 62, sho: 28, pas: 52, dri: 55, def: 76, phy: 80 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_5', name: 'Loai Taha', position: 'CB', rating: 72,
    nationality: 'Israel', country: 'Israel',
    club: 'Hapoel Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 65, sho: 25, pas: 54, dri: 56, def: 74, phy: 78 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_6', name: 'Yonatan Cohen', position: 'CB', rating: 68,
    nationality: 'Israel', country: 'Israel',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 60, sho: 22, pas: 48, dri: 50, def: 70, phy: 75 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_7', name: 'Roy Gordana', position: 'CB', rating: 63,
    nationality: 'Israel', country: 'Israel',
    club: 'Beitar Jerusalem', leagueName: "Ligat Ha'al",
    stats: { pac: 58, sho: 18, pas: 44, dri: 46, def: 65, phy: 70 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Left-Backs ──────────────────────────────────────────────────────────────
  {
    id: 'isr_8', name: 'Taleb Tawatha', position: 'LB', rating: 75,
    nationality: 'Israel', country: 'Israel',
    club: 'Israeli National', leagueName: "Ligat Ha'al",
    stats: { pac: 78, sho: 42, pas: 68, dri: 70, def: 74, phy: 72 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_9', name: 'Ofir Davidzada', position: 'LB', rating: 72,
    nationality: 'Israel', country: 'Israel',
    club: 'Beitar Jerusalem', leagueName: "Ligat Ha'al",
    stats: { pac: 74, sho: 38, pas: 64, dri: 68, def: 70, phy: 68 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_10', name: 'Omer Spungin', position: 'LB', rating: 62,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Petah Tikva', leagueName: "Ligat Ha'al",
    stats: { pac: 66, sho: 28, pas: 54, dri: 58, def: 62, phy: 60 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Right-Backs ─────────────────────────────────────────────────────────────
  {
    id: 'isr_11', name: 'Eli Dasa', position: 'RB', rating: 73,
    nationality: 'Israel', country: 'Israel',
    club: 'Israeli National', leagueName: "Ligat Ha'al",
    stats: { pac: 76, sho: 40, pas: 65, dri: 70, def: 72, phy: 70 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_12', name: 'Yali Ziv', position: 'RB', rating: 70,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 72, sho: 36, pas: 60, dri: 65, def: 68, phy: 67 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Defensive Midfielders ───────────────────────────────────────────────────
  {
    id: 'isr_13', name: 'Nir Bitton', position: 'CDM', rating: 76,
    nationality: 'Israel', country: 'Israel',
    club: 'Israeli National', leagueName: "Ligat Ha'al",
    stats: { pac: 70, sho: 40, pas: 74, dri: 68, def: 78, phy: 80 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_14', name: 'Sheran Yeini', position: 'CDM', rating: 74,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 66, sho: 38, pas: 72, dri: 66, def: 76, phy: 76 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_15', name: 'Ali Mohamed', position: 'CDM', rating: 71,
    nationality: 'Israel', country: 'Israel',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 68, sho: 36, pas: 68, dri: 64, def: 73, phy: 74 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_16', name: 'Almog Cohen', position: 'CDM', rating: 70,
    nationality: 'Israel', country: 'Israel',
    club: 'Israeli National', leagueName: "Ligat Ha'al",
    stats: { pac: 66, sho: 34, pas: 66, dri: 62, def: 72, phy: 72 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Central Midfielders ─────────────────────────────────────────────────────
  {
    id: 'isr_17', name: 'Dor Peretz', position: 'CM', rating: 78,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 76, sho: 68, pas: 80, dri: 76, def: 62, phy: 72 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_18', name: 'Gal Shem Tov', position: 'CM', rating: 72,
    nationality: 'Israel', country: 'Israel',
    club: 'Israeli National', leagueName: "Ligat Ha'al",
    stats: { pac: 74, sho: 60, pas: 74, dri: 72, def: 54, phy: 68 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_19', name: 'Dor Micha', position: 'CM', rating: 69,
    nationality: 'Israel', country: 'Israel',
    club: 'Bnei Yehuda', leagueName: "Ligat Ha'al",
    stats: { pac: 70, sho: 55, pas: 70, dri: 68, def: 50, phy: 64 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_20', name: 'Eyal Golasa', position: 'CM', rating: 63,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 62, sho: 46, pas: 64, dri: 60, def: 46, phy: 60 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_21', name: 'Or Dayan', position: 'CM', rating: 64,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 64, sho: 48, pas: 62, dri: 62, def: 48, phy: 62 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Attacking Midfielders ───────────────────────────────────────────────────
  {
    id: 'isr_22', name: 'Lior Refaelov', position: 'CAM', rating: 76,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 68, sho: 74, pas: 80, dri: 80, def: 38, phy: 62 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_23', name: 'Osama Khalaila', position: 'CAM', rating: 72,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 72, sho: 68, pas: 74, dri: 76, def: 34, phy: 60 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Left Wingers ────────────────────────────────────────────────────────────
  {
    id: 'isr_24', name: 'Maor Buzaglo', position: 'LW', rating: 73,
    nationality: 'Israel', country: 'Israel',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 80, sho: 68, pas: 68, dri: 80, def: 38, phy: 66 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_25', name: 'Eliel Peretz', position: 'LW', rating: 70,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 78, sho: 65, pas: 66, dri: 76, def: 36, phy: 64 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Right Wingers ───────────────────────────────────────────────────────────
  {
    id: 'isr_26', name: 'Manor Solomon', position: 'RW', rating: 78,
    nationality: 'Israel', country: 'Israel',
    club: 'Leeds United', leagueName: 'Premier League',
    stats: { pac: 90, sho: 74, pas: 70, dri: 84, def: 36, phy: 68 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_27', name: 'Omer Atzili', position: 'RW', rating: 73,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 84, sho: 68, pas: 64, dri: 80, def: 34, phy: 62 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_28', name: 'Dolev Haziza', position: 'RW', rating: 72,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 82, sho: 66, pas: 62, dri: 78, def: 32, phy: 60 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Strikers ─────────────────────────────────────────────────────────────────
  {
    id: 'isr_29', name: 'Eran Zahavi', position: 'ST', rating: 80,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 76, sho: 86, pas: 68, dri: 80, def: 30, phy: 78 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_30', name: 'Shon Weissman', position: 'ST', rating: 75,
    nationality: 'Israel', country: 'Israel',
    club: 'Standard Liège', leagueName: 'Jupiler Pro League',
    stats: { pac: 72, sho: 82, pas: 60, dri: 72, def: 28, phy: 82 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_31', name: 'Sagiv Jehezkel', position: 'ST', rating: 74,
    nationality: 'Israel', country: 'Israel',
    club: 'Antalyaspor', leagueName: 'Süper Lig',
    stats: { pac: 74, sho: 78, pas: 58, dri: 70, def: 26, phy: 78 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_32', name: 'Dia Saba', position: 'ST', rating: 73,
    nationality: 'Israel', country: 'Israel',
    club: 'Israeli National', leagueName: "Ligat Ha'al",
    stats: { pac: 76, sho: 74, pas: 56, dri: 68, def: 26, phy: 76 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_33', name: 'Tomer Hemed', position: 'ST', rating: 70,
    nationality: 'Israel', country: 'Israel',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 68, sho: 74, pas: 52, dri: 66, def: 24, phy: 78 },
    eaId: null, image: null, _source: 'israeli',
  },

  // ── Foreign players in Israeli clubs ────────────────────────────────────────
  // These players are NOT Israeli nationals, but they play in Ligat Ha'al clubs.
  // They are part of the Israeli football ecosystem and appear in packs/squads.
  // _source is 'israeli' because they belong to the Israeli football dataset,
  // not because of their nationality.

  // Gold (≥75) ─────────────────────────────────────────────────────────────────
  {
    id: 'isr_34', name: 'Deni Jurić', position: 'ST', rating: 76,
    nationality: 'Croatia', country: 'Croatia',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 78, sho: 82, pas: 62, dri: 74, def: 32, phy: 80 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_35', name: 'Predrag Rajković', position: 'GK', rating: 75,
    nationality: 'Serbia', country: 'Serbia',
    club: 'Beitar Jerusalem', leagueName: "Ligat Ha'al",
    stats: { pac: 65, sho: 14, pas: 60, dri: 58, def: 22, phy: 76 },
    eaId: null, image: null, _source: 'israeli',
  },

  // Silver (65-74) ──────────────────────────────────────────────────────────────
  {
    id: 'isr_36', name: 'Tjaronn Chery', position: 'CAM', rating: 74,
    nationality: 'Suriname', country: 'Suriname',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 74, sho: 72, pas: 80, dri: 82, def: 40, phy: 64 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_37', name: 'Mërgim Vojvoda', position: 'RB', rating: 73,
    nationality: 'Kosovo', country: 'Kosovo',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 78, sho: 42, pas: 66, dri: 72, def: 73, phy: 72 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_38', name: 'Gershon Koffie', position: 'CDM', rating: 72,
    nationality: 'Ghana', country: 'Ghana',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 68, sho: 36, pas: 70, dri: 64, def: 74, phy: 74 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_39', name: 'Louis Schaub', position: 'CAM', rating: 72,
    nationality: 'Austria', country: 'Austria',
    club: 'Hapoel Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 70, sho: 68, pas: 76, dri: 76, def: 36, phy: 62 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_40', name: 'Maximiliano Caufriez', position: 'CB', rating: 72,
    nationality: 'Belgium', country: 'Belgium',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 68, sho: 26, pas: 54, dri: 58, def: 74, phy: 78 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_41', name: 'Carlos Strandberg', position: 'ST', rating: 71,
    nationality: 'Sweden', country: 'Sweden',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 70, sho: 76, pas: 54, dri: 68, def: 26, phy: 80 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_42', name: 'Leeroy Owusu', position: 'LW', rating: 71,
    nationality: 'Ghana', country: 'Ghana',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 82, sho: 64, pas: 64, dri: 76, def: 36, phy: 66 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_43', name: 'Patrick Twumasi', position: 'LW', rating: 71,
    nationality: 'Ghana', country: 'Ghana',
    club: 'Beitar Jerusalem', leagueName: "Ligat Ha'al",
    stats: { pac: 84, sho: 62, pas: 62, dri: 76, def: 34, phy: 64 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_44', name: 'Jon Guridi', position: 'CDM', rating: 71,
    nationality: 'Spain', country: 'Spain',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 66, sho: 34, pas: 68, dri: 62, def: 73, phy: 74 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_45', name: 'Abdoulaye Seck', position: 'CB', rating: 71,
    nationality: 'Senegal', country: 'Senegal',
    club: 'Bnei Yehuda', leagueName: "Ligat Ha'al",
    stats: { pac: 66, sho: 22, pas: 52, dri: 54, def: 73, phy: 76 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_46', name: 'Jodel Dossou', position: 'RW', rating: 71,
    nationality: 'Benin', country: 'Benin',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 84, sho: 66, pas: 60, dri: 74, def: 36, phy: 62 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_47', name: 'Claudemir', position: 'CDM', rating: 70,
    nationality: 'Brazil', country: 'Brazil',
    club: 'Hapoel Beer Sheva', leagueName: "Ligat Ha'al",
    stats: { pac: 64, sho: 32, pas: 66, dri: 60, def: 72, phy: 74 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_48', name: 'Stef Pinho', position: 'ST', rating: 70,
    nationality: 'Belgium', country: 'Belgium',
    club: 'Maccabi Haifa', leagueName: "Ligat Ha'al",
    stats: { pac: 70, sho: 74, pas: 52, dri: 66, def: 26, phy: 76 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_49', name: 'Franck Kom', position: 'CDM', rating: 70,
    nationality: 'Cameroon', country: 'Cameroon',
    club: 'Maccabi Tel Aviv', leagueName: "Ligat Ha'al",
    stats: { pac: 64, sho: 32, pas: 64, dri: 58, def: 72, phy: 74 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_50', name: 'Gustavo Boccoli', position: 'ST', rating: 70,
    nationality: 'Brazil', country: 'Brazil',
    club: 'Beitar Jerusalem', leagueName: "Ligat Ha'al",
    stats: { pac: 72, sho: 72, pas: 52, dri: 68, def: 26, phy: 74 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_51', name: 'Erik Sabo', position: 'CM', rating: 69,
    nationality: 'Slovakia', country: 'Slovakia',
    club: 'Ironi Kiryat Shmona', leagueName: "Ligat Ha'al",
    stats: { pac: 68, sho: 52, pas: 68, dri: 66, def: 50, phy: 64 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_52', name: 'Giani Crețu', position: 'LW', rating: 69,
    nationality: 'Romania', country: 'Romania',
    club: 'Beitar Jerusalem', leagueName: "Ligat Ha'al",
    stats: { pac: 78, sho: 62, pas: 60, dri: 74, def: 34, phy: 60 },
    eaId: null, image: null, _source: 'israeli',
  },
  {
    id: 'isr_53', name: 'Azer Busuladzic', position: 'ST', rating: 68,
    nationality: 'Bosnia', country: 'Bosnia',
    club: 'Ironi Kiryat Shmona', leagueName: "Ligat Ha'al",
    stats: { pac: 68, sho: 72, pas: 50, dri: 64, def: 24, phy: 74 },
    eaId: null, image: null, _source: 'israeli',
  },

];

// ── Rating distribution (53 players total) ────────────────────────────────────
// Gold   (≥75): Zahavi 80, Peretz 78, Solomon 78, Glazer 76, Bitton 76,
//               Refaelov 76, Jurić 76, Tawatha 75, Weissman 75, Rajković 75 → 10
// Silver (65-74): 38 players (Israeli + foreign league players)
// Bronze (≤64): Ben Zion 62, Gordana 63, Spungin 62, Golasa 63, Or Dayan 64 → 5

export function getAllPlayers() {
  return ISRAELI_PLAYERS;
}
