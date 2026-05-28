// AOW bedragen 2026
export const AOW_ALLEENSTAAND_MAAND = 1637.57;
export const AOW_ALLEENSTAAND_VAKANTIE_MAAND = 106.55;
export const AOW_PARTNER_MAAND = 1122.12;
export const AOW_PARTNER_VAKANTIE_MAAND = 76.10;

export const AOW_ALLEENSTAAND_JAAR =
  (AOW_ALLEENSTAAND_MAAND + AOW_ALLEENSTAAND_VAKANTIE_MAAND) * 12;
export const AOW_PARTNER_JAAR =
  (AOW_PARTNER_MAAND + AOW_PARTNER_VAKANTIE_MAAND) * 12;

// Belastingschijven Box 1 2026
export const BOX1_VOOR_AOW = [
  { grens: 38883, tarief: 0.3575 },
  { grens: 78426, tarief: 0.3756 },
  { grens: Infinity, tarief: 0.495 },
];

export const BOX1_NA_AOW = [
  { grens: 38883, tarief: 0.1785 },
  { grens: 78426, tarief: 0.3756 },
  { grens: Infinity, tarief: 0.495 },
];

// Box 2 schijven 2026
export const BOX2_SCHIJVEN = [
  { grens: 67000, tarief: 0.245 },
  { grens: Infinity, tarief: 0.33 },
];

// Vennootschapsbelasting 2026
export const VPB_SCHIJVEN = [
  { grens: 200000, tarief: 0.19 },
  { grens: Infinity, tarief: 0.258 },
];

// Box 3 2026
export const BOX3_VRIJSTELLING_PERSOON = 57684;
export const BOX3_TARIEF = 0.36;
export const BOX3_FICTIEF_RENDEMENT_SPAREN = 0.0144;
export const BOX3_FICTIEF_RENDEMENT_BELEGGEN = 0.0588;

// Heffingskortingen 2026
export const AHK_MAX = 3362;
export const AHK_AFBOUW_START = 24812;
export const AHK_AFBOUW_EIND = 75518;
export const AHK_AFBOUW_TARIEF = 0.06337;

export const ARBEIDSKORTING_MAX = 5599;
export const ARBEIDSKORTING_OPBOUW_1_TARIEF = 0.08425;
export const ARBEIDSKORTING_OPBOUW_1_GRENS = 24820;
export const ARBEIDSKORTING_OPBOUW_2_TARIEF = 0.29861;
export const ARBEIDSKORTING_OPBOUW_2_GRENS = 39957;
export const ARBEIDSKORTING_AFBOUW_TARIEF = 0.06510;
export const ARBEIDSKORTING_AFBOUW_GRENS = 124935;

export const OUDERENKORTING_MAX = 2035;
export const OUDERENKORTING_AFBOUW_START = 44770;
export const OUDERENKORTING_AFBOUW_EIND = 58340;
export const OUDERENKORTING_AFBOUW_TARIEF = 0.15;

export const ALLEENSTAANDE_OUDERENKORTING = 478;

export const IACK_MAX = 2950;
export const IACK_DREMPEL = 6073;
export const IACK_TARIEF = 0.1145;

// AOW leeftijdstabel
export const AOW_LEEFTIJD_TABEL = [
  { van: '1956-06-01', tot: '1957-02-28', jaren: 66, maanden: 10 },
  { van: '1957-03-01', tot: '1960-12-31', jaren: 67, maanden: 0 },
  { van: '1961-01-01', tot: '1966-09-30', jaren: 67, maanden: 3 },
  { van: '1966-10-01', tot: '1970-06-30', jaren: 67, maanden: 6 },
  { van: '1970-07-01', tot: '1973-03-31', jaren: 67, maanden: 9 },
  { van: '1973-04-01', tot: '1975-12-31', jaren: 68, maanden: 0 },
  { van: '1976-01-01', tot: '1978-09-30', jaren: 68, maanden: 3 },
  { van: '1978-10-01', tot: '1982-06-30', jaren: 68, maanden: 6 },
  { van: '1982-07-01', tot: '1985-03-31', jaren: 68, maanden: 9 },
  { van: '1985-04-01', tot: '1988-12-31', jaren: 69, maanden: 0 },
  { van: '1989-01-01', tot: '1991-09-30', jaren: 69, maanden: 3 },
  { van: '1991-10-01', tot: '1995-06-30', jaren: 69, maanden: 6 },
  { van: '1995-07-01', tot: '1999-03-31', jaren: 69, maanden: 9 },
  { van: '1999-04-01', tot: '2000-12-31', jaren: 70, maanden: 0 },
];

// Woningwaarde
export const WONINGWAARDE_STIJGING = 0.057;
export const WOZ_STIJGING = 0.057;

// Eigenwoning forfait
export const EWF_TARIEF_LAAG = 0.0035;
export const EWF_GRENS = 1200000;
export const EWF_TARIEF_HOOG = 0.0235;

// Rendement en inflatie
export const ANNUITEIT_RENDEMENT = 0.04;
export const INFLATIE = 0.027;
