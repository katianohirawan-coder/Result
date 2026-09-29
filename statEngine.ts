/**
 * Memento Mori Mathematical Combat Power (CP) and Base Stat Engine
 * Implements reverse-engineered and master datamined formulas from ScobraCK/MementoMori-data
 * Reference: Gambar 1 & Gambar 2 (In-Game Battle Power Conversion Rates)
 * Verified against real in-game benchmark:
 * Cordie LR+5 Level 333.0, Player Rank 433
 * Includes exact InitialBattleParameters (such as Florence PM. DEF Break = 2)
 */

import {
  CharacterEntry,
  RarityEntry,
  PlayerRankBonus,
  getLevelBaseParam,
  getPlayerRankBonus,
} from '../data/mementoData';

export interface CpRateConfig {
  hp: number;
  atk: number;
  def: number;
  pmDefPen: number; // 物魔防御貫通 (PM. DEF Break)
  defPen: number;   // 防御貫通 (DEF Break)
  pDef: number;     // 物理防御 (P.DEF)
  mDef: number;     // 魔法防御 (M.DEF)
  hit: number;      // 命中 (Accuracy / Hit)
  evasion: number;  // 回避 (Evasion / EVA)
  crit: number;     // クリティカル (Critical)
  critRes: number;  // クリ耐性 (CRIT RES)
  critDmgBoost: number; // 2.000 CP per 1.0% (クリダメ強化)
  pCritCut: number;     // 2.000 CP per 1.0% (物クリ緩和)
  mCritCut: number;     // 2.000 CP per 1.0% (魔クリ緩和)
  debuffHit: number;    // 弱体効果命中 (Debuff ACC)
  debuffRes: number;    // 弱体効果耐性 (Debuff RES)
  counter: number;      // 1.500 CP per 1.0% (カウンタ)
  hpDrain: number;      // 1.500 CP per 1.0% (ドレイン)
}

export const CP_RATES: CpRateConfig = {
  hp: 0.05,
  atk: 2.0,
  def: 7 / 3, // 2.3333333333333335 (7 Defense = 3 CP ratio)
  pmDefPen: 7.0, // 物魔防御貫通 (PM. DEF Break)
  defPen: 7.0,   // 防御貫通 (DEF Break)
  pDef: 1.5,
  mDef: 1.5,
  hit: 1.0,
  evasion: 1.0,
  crit: 3.0,
  critRes: 3.0,
  critDmgBoost: 2000.0, // 2.000 CP per 1%
  pCritCut: 2000.0,     // 2.000 CP per 1%
  mCritCut: 2000.0,     // 2.000 CP per 1%
  debuffHit: 1.0,
  debuffRes: 1.0,
  counter: 1500.0,      // 1.500 CP per 1%
  hpDrain: 1500.0,      // 1.500 CP per 1%
};

export interface ParamModifier {
  flat: number;
  perLevel: number;
  pct: number;
}

export const createEmptyModifier = (): ParamModifier => ({
  flat: 0,
  perLevel: 0,
  pct: 0,
});

export interface UniversalArcanaModifiers {
  // 4 Primary Potentials
  str: ParamModifier;
  dex: ParamModifier;
  mag: ParamModifier;
  sta: ParamModifier;

  // Combat & Survival Parameters
  hp: ParamModifier;
  atk: ParamModifier;
  def: ParamModifier;
  pDef: ParamModifier;
  mDef: ParamModifier;
  hit: ParamModifier;
  evasion: ParamModifier;
  crit: ParamModifier;
  critRes: ParamModifier;
  debuffHit: ParamModifier;
  debuffRes: ParamModifier;
  defPen: ParamModifier;      // DEF Break
  pmDefBreak: ParamModifier;  // PM. DEF Break

  // Pure Percentage Parameters
  critDmgBoostPct: number;
  pCritCutPct: number;
  mCritCutPct: number;
  counterPct: number;
  hpDrainPct: number;
}

export const DEFAULT_UNIVERSAL_MODIFIERS: UniversalArcanaModifiers = {
  str: createEmptyModifier(),
  dex: createEmptyModifier(),
  mag: createEmptyModifier(),
  sta: createEmptyModifier(),
  hp: createEmptyModifier(),
  atk: createEmptyModifier(),
  def: createEmptyModifier(),
  pDef: createEmptyModifier(),
  mDef: createEmptyModifier(),
  hit: createEmptyModifier(),
  evasion: createEmptyModifier(),
  crit: createEmptyModifier(),
  critRes: createEmptyModifier(),
  debuffHit: createEmptyModifier(),
  debuffRes: createEmptyModifier(),
  defPen: createEmptyModifier(),
  pmDefBreak: createEmptyModifier(),
  critDmgBoostPct: 0,
  pCritCutPct: 0,
  mCritCutPct: 0,
  counterPct: 0,
  hpDrainPct: 0,
};

export type RoundingMethod = 'floor_grand' | 'floor_each' | 'round_grand';

export interface EngineConfig {
  character: CharacterEntry;
  rarity: RarityEntry;
  level: number;
  subLevel: number;
  mode: 'pure_base' | 'account_mirror';
  playerRank: number;
  modifiers: UniversalArcanaModifiers;
  roundingMethod?: RoundingMethod;
}

export interface CpItemBreakdown {
  id: string;
  name: string;
  jpName: string;
  value: number;
  rate: number;
  rateLabel: string;
  cp: number;
  floorCp: number;
  category: 'Offense' | 'Defense' | 'Survival' | 'Utility' | 'Special';
  isPct?: boolean;
  isSpeed?: boolean;
}

export interface EngineResult {
  rawLevelBase: number;
  scaledTotal: number;
  str: number;
  dex: number;
  mag: number;
  sta: number;
  sumPotential: number;
  speed: number;
  // Substats from potential
  potHp: number;
  potMatchingAtk: number;
  potPDef: number;
  potMDef: number;
  potHit: number;
  potEva: number;
  potCrit: number;
  potCritRes: number;
  potDebuffHit: number;
  // Account additions
  rankBonus: PlayerRankBonus;
  // Final Panel Attributes
  finalHp: number;
  finalAtk: number;
  finalDef: number;
  finalPDef: number;
  finalMDef: number;
  finalHit: number;
  finalEva: number;
  finalCrit: number;
  finalCritRes: number;
  finalDebuffHit: number;
  finalDebuffRes: number;
  finalPmDefBreak: number;
  finalDefPen: number;
  finalCritDmgBoostPct: number;
  finalPCritCutPct: number;
  finalMCritCutPct: number;
  finalCounterPct: number;
  finalHpDrainPct: number;
  // CP Calculations
  speedMultiplier: number;
  speedCp: number;
  breakdown: CpItemBreakdown[];
  totalCpFloat: number;
  totalCpFloor: number;      // Method B: floor(sum(float))
  totalCpFloorEach: number;  // Method A: sum(floor(float))
  totalCpRound: number;      // Method C: round(sum(float))
  activeCp: number;          // Evaluated based on selected roundingMethod
  roundingMethod: RoundingMethod;
  // Comparative Diff
  pureBaseCp: number;
  accountBonusCp: number;
}

export function evalParamMod(mod: ParamModifier, charLevel: number, baseValue = 0): number {
  const flat = mod.flat || 0;
  const fromLevel = (mod.perLevel || 0) * charLevel;
  const fromPct = baseValue > 0 ? (baseValue * (mod.pct || 0)) / 100 : 0;
  return flat + fromLevel + fromPct;
}

export function calculateCharacterStats(config: EngineConfig): EngineResult {
  const { character, rarity, level, subLevel, mode, playerRank, modifiers, roundingMethod = 'floor_grand' } = config;

  // 1. Raw Potential Base from Level & Sub-Level
  const clampedSub = Math.min(9, Math.max(0, Math.floor(subLevel)));
  const rawLevelBase = getLevelBaseParam(level, clampedSub);

  // 2. Scaled Total Potential using Rarity Slope & Intercept
  const scaledTotal = Math.floor(rawLevelBase * rarity.m + rarity.b);

  // 3. Primary Attributes (STR, DEX, MAG, STA)
  const gross = character.gross || 340;
  const rawStr = Math.floor((scaledTotal * character.muscle) / gross);
  const rawDex = Math.floor((scaledTotal * character.energy) / gross);
  const rawMag = Math.floor((scaledTotal * character.intelligence) / gross);
  const rawSta = Math.floor((scaledTotal * character.health) / gross);

  // Add potential modifiers in account_mirror mode
  const addedStr = mode === 'account_mirror' ? Math.floor(evalParamMod(modifiers.str, level, rawStr)) : 0;
  const addedDex = mode === 'account_mirror' ? Math.floor(evalParamMod(modifiers.dex, level, rawDex)) : 0;
  const addedMag = mode === 'account_mirror' ? Math.floor(evalParamMod(modifiers.mag, level, rawMag)) : 0;
  const addedSta = mode === 'account_mirror' ? Math.floor(evalParamMod(modifiers.sta, level, rawSta)) : 0;

  const str = rawStr + addedStr;
  const dex = rawDex + addedDex;
  const mag = rawMag + addedMag;
  const sta = rawSta + addedSta;
  const sumPotential = str + dex + mag + sta;
  const speed = character.baseSpeed || 2894;

  // 4. Derived Sub-stats from Potential (Tabel Resmi Gambar 2):
  // STR -> P.DEF +1, Hit +0.5
  const potPDef = str * 1;
  const potHit = Math.floor(str * 0.5);
  // DEX -> Evasion +0.5, Crit +0.5
  const potEva = Math.floor(dex * 0.5);
  const potCrit = Math.floor(dex * 0.5);
  // MAG -> M.DEF +1, Debuff Hit +0.5
  const potMDef = mag * 1;
  const potDebuffHit = Math.floor(mag * 0.5);
  // STA -> HP +10, Crit RES +0.5
  const potHp = sta * 10;
  const potCritRes = Math.floor(sta * 0.5);

  // Primary Stat Matching ATK:
  let potMatchingAtk = 0;
  if (character.job === 'Warrior') potMatchingAtk = str;
  else if (character.job === 'Sniper') potMatchingAtk = dex;
  else if (character.job === 'Sorcerer') potMatchingAtk = mag;

  // Initial Battle Parameter from CharacterMB (Now with Florence PM. DEF Break = 2, Elfrinde DEF Break = 2, etc.)
  const init = character.initialBattleParam || {
    atk: 0, hp: 0, def: 10, mDefRelax: 0, pDefRelax: 0, avoidance: 0, hit: 0, critical: 0, critResist: 0, speed, pmDefBreak: 0, defPen: 0
  };

  // 5. Account Modifiers (Applied in 'account_mirror' mode)
  const rankBonus = mode === 'account_mirror' ? getPlayerRankBonus(playerRank) : { atk: 0, hp: 0, hpPct: 0, atkPct: 0, hit: 0, crit: 0, slots: 0 };

  // 6. In-Game Tested Final HP and ATK Formula
  let finalHp = 0;
  let finalAtk = 0;

  if (mode === 'pure_base') {
    // Stat Murni Karakter (Tanpa Rank atau Arcana)
    finalHp = potHp + init.hp;
    finalAtk = potMatchingAtk + init.atk;
  } else {
    // Extra Arcana HP & ATK additions
    const arcanaExtraHp = evalParamMod(modifiers.hp, level, potHp);
    const arcanaExtraAtk = evalParamMod(modifiers.atk, level, potMatchingAtk);

    // In-game Memento Mori: Player Rank Flat HP ditambahkan ke Base HP karakter sebelum dikalikan (1 + HP%)
    const baseHpPrePercent = potHp + rankBonus.hp + init.hp + arcanaExtraHp;
    const totalHpPct = (rankBonus.hpPct || 0) + (modifiers.hp.pct || 0);
    finalHp = Math.floor(baseHpPrePercent * (1 + totalHpPct / 100));

    // ATK = Primary stat + Rank Flat ATK + Init ATK + Extra Arcana ATK
    const baseAtkPrePercent = potMatchingAtk + rankBonus.atk + init.atk + arcanaExtraAtk;
    const totalAtkPct = (rankBonus.atkPct || 0) + (modifiers.atk.pct || 0);
    finalAtk = Math.floor(baseAtkPrePercent * (1 + totalAtkPct / 100));
  }

  // 7. Defensive & Utility Final Parameters (Included base character initial params!)
  const extraDef = mode === 'account_mirror' ? evalParamMod(modifiers.def, level, init.def || 10) : 0;
  const extraPDef = mode === 'account_mirror' ? evalParamMod(modifiers.pDef, level, potPDef) : 0;
  const extraMDef = mode === 'account_mirror' ? evalParamMod(modifiers.mDef, level, potMDef) : 0;
  const extraHit = mode === 'account_mirror' ? evalParamMod(modifiers.hit, level, potHit) : 0;
  const extraEva = mode === 'account_mirror' ? evalParamMod(modifiers.evasion, level, potEva) : 0;
  const extraCrit = mode === 'account_mirror' ? evalParamMod(modifiers.crit, level, potCrit) : 0;
  const extraCritRes = mode === 'account_mirror' ? evalParamMod(modifiers.critRes, level, potCritRes) : 0;
  const extraDebuffHit = mode === 'account_mirror' ? evalParamMod(modifiers.debuffHit, level, potDebuffHit) : 0;
  const extraDebuffRes = mode === 'account_mirror' ? evalParamMod(modifiers.debuffRes, level, 0) : 0;
  const extraDefPen = mode === 'account_mirror' ? evalParamMod(modifiers.defPen, level, 0) : 0;
  const extraPmDefBreak = mode === 'account_mirror' ? evalParamMod(modifiers.pmDefBreak, level, 0) : 0;

  const finalDef = (init.def || 10) + Math.floor(extraDef);
  const finalPDef = potPDef + (init.pDefRelax || 0) + Math.floor(extraPDef);
  const finalMDef = potMDef + (init.mDefRelax || 0) + Math.floor(extraMDef);
  const finalHit = potHit + (init.hit || 0) + (rankBonus.hit || 0) + Math.floor(extraHit);
  const finalEva = potEva + (init.avoidance || 0) + Math.floor(extraEva);
  const finalCrit = potCrit + (init.critical || 0) + (rankBonus.crit || 0) + Math.floor(extraCrit);
  const finalCritRes = potCritRes + (init.critResist || 0) + Math.floor(extraCritRes);
  const finalDebuffHit = potDebuffHit + Math.floor(extraDebuffHit);
  const finalDebuffRes = Math.floor(extraDebuffRes);
  
  // Notice: init.pmDefBreak and init.defPen are now fully preserved in both Pure Base and Account Mirror!
  const finalPmDefBreak = (init.pmDefBreak || 0) + Math.floor(extraPmDefBreak);
  const finalDefPen = (init.defPen || 0) + Math.floor(extraDefPen);

  const finalCritDmgBoostPct = mode === 'account_mirror' ? (modifiers.critDmgBoostPct || 0) : 0;
  const finalPCritCutPct = mode === 'account_mirror' ? (modifiers.pCritCutPct || 0) : 0;
  const finalMCritCutPct = mode === 'account_mirror' ? (modifiers.mCritCutPct || 0) : 0;
  const finalCounterPct = mode === 'account_mirror' ? (modifiers.counterPct || 0) : 0;
  const finalHpDrainPct = mode === 'account_mirror' ? (modifiers.hpDrainPct || 0) : 0;

  // 8. Combat Power (CP) Conversion Rates (Gambar 1 & Gambar 2 with In-Game Official Names)
  const speedMultiplier = speed / 8000;
  const speedCp = sumPotential * speedMultiplier;

  const rawBreakdown = [
    {
      id: 'hp',
      name: 'HP (Hit Points)',
      jpName: 'HP',
      value: finalHp,
      rate: CP_RATES.hp,
      rateLabel: '× 0.05',
      category: 'Survival' as const,
    },
    {
      id: 'atk',
      name: 'Attack (ATK)',
      jpName: '攻撃力',
      value: finalAtk,
      rate: CP_RATES.atk,
      rateLabel: '× 2.0',
      category: 'Offense' as const,
    },
    {
      id: 'def',
      name: 'Defense (DEF)',
      jpName: '防御力',
      value: finalDef,
      rate: CP_RATES.def,
      rateLabel: '× 2.333',
      category: 'Defense' as const,
    },
    {
      id: 'pDef',
      name: 'Physical Defense (P.DEF)',
      jpName: '物理防御',
      value: finalPDef,
      rate: CP_RATES.pDef,
      rateLabel: '× 1.5',
      category: 'Defense' as const,
    },
    {
      id: 'mDef',
      name: 'Magic Defense (M.DEF)',
      jpName: '魔法防御',
      value: finalMDef,
      rate: CP_RATES.mDef,
      rateLabel: '× 1.5',
      category: 'Defense' as const,
    },
    {
      id: 'hit',
      name: 'Accuracy (Hit)',
      jpName: '命中',
      value: finalHit,
      rate: CP_RATES.hit,
      rateLabel: '× 1.0',
      category: 'Utility' as const,
    },
    {
      id: 'evasion',
      name: 'Evasion (EVA)',
      jpName: '回避',
      value: finalEva,
      rate: CP_RATES.evasion,
      rateLabel: '× 1.0',
      category: 'Survival' as const,
    },
    {
      id: 'crit',
      name: 'Critical (CRIT)',
      jpName: 'クリティカル',
      value: finalCrit,
      rate: CP_RATES.crit,
      rateLabel: '× 3.0',
      category: 'Offense' as const,
    },
    {
      id: 'critRes',
      name: 'Crit Resistance (CRIT RES)',
      jpName: 'クリ耐性',
      value: finalCritRes,
      rate: CP_RATES.critRes,
      rateLabel: '× 3.0',
      category: 'Survival' as const,
    },
    {
      id: 'debuffHit',
      name: 'Debuff ACC',
      jpName: '弱体効果命中',
      value: finalDebuffHit,
      rate: CP_RATES.debuffHit,
      rateLabel: '× 1.0',
      category: 'Utility' as const,
    },
    {
      id: 'debuffRes',
      name: 'Debuff RES',
      jpName: '弱体効果耐性',
      value: finalDebuffRes,
      rate: CP_RATES.debuffRes,
      rateLabel: '× 1.0',
      category: 'Survival' as const,
    },
    {
      id: 'pmDefBreak',
      name: 'PM. DEF Break',
      jpName: '物魔防御貫通',
      value: finalPmDefBreak,
      rate: CP_RATES.pmDefPen,
      rateLabel: '× 7.0',
      category: 'Offense' as const,
    },
    {
      id: 'defPen',
      name: 'DEF Break',
      jpName: '防御貫通',
      value: finalDefPen,
      rate: CP_RATES.defPen,
      rateLabel: '× 7.0',
      category: 'Offense' as const,
    },
    {
      id: 'critDmgBoost',
      name: 'CRIT DMG Boost',
      jpName: 'クリダメ強化',
      value: finalCritDmgBoostPct,
      rate: CP_RATES.critDmgBoost,
      rateLabel: '× 2,000 / %',
      isPct: true,
      category: 'Offense' as const,
    },
    {
      id: 'pCritCut',
      name: 'P.CRIT Cut',
      jpName: '物クリ緩和',
      value: finalPCritCutPct,
      rate: CP_RATES.pCritCut,
      rateLabel: '× 2,000 / %',
      isPct: true,
      category: 'Defense' as const,
    },
    {
      id: 'mCritCut',
      name: 'M.CRIT Cut',
      jpName: '魔クリ緩和',
      value: finalMCritCutPct,
      rate: CP_RATES.mCritCut,
      rateLabel: '× 2,000 / %',
      isPct: true,
      category: 'Defense' as const,
    },
    {
      id: 'counter',
      name: 'Counter Attack',
      jpName: 'カウンタ',
      value: finalCounterPct,
      rate: CP_RATES.counter,
      rateLabel: '× 1,500 / %',
      isPct: true,
      category: 'Special' as const,
    },
    {
      id: 'hpDrain',
      name: 'HP Drain',
      jpName: 'ドレイン',
      value: finalHpDrainPct,
      rate: CP_RATES.hpDrain,
      rateLabel: '× 1,500 / %',
      isPct: true,
      category: 'Special' as const,
    },
    {
      id: 'speedCoupling',
      name: 'Speed Coupling CP',
      jpName: 'スピード連動戦闘力',
      value: speed,
      rate: speedMultiplier,
      rateLabel: `Total Pot × (${speed}/8000)`,
      isSpeed: true,
      category: 'Utility' as const,
    },
  ];

  const breakdown: CpItemBreakdown[] = rawBreakdown.map((item) => {
    const cp = item.id === 'speedCoupling' ? speedCp : item.value * item.rate;
    return {
      ...item,
      cp,
      floorCp: Math.floor(cp),
    };
  });

  const totalCpFloat = breakdown.reduce((acc, item) => acc + item.cp, 0);
  const totalCpFloor = Math.floor(totalCpFloat);
  const totalCpFloorEach = breakdown.reduce((acc, item) => acc + item.floorCp, 0);
  const totalCpRound = Math.round(totalCpFloat);

  let activeCp = totalCpFloor;
  if (roundingMethod === 'floor_each') activeCp = totalCpFloorEach;
  else if (roundingMethod === 'round_grand') activeCp = totalCpRound;

  // Pure Base Calculation for Delta comparison
  let pureBaseCp = 0;
  if (mode === 'account_mirror') {
    const pureResult = calculateCharacterStats({
      ...config,
      mode: 'pure_base',
      modifiers: DEFAULT_UNIVERSAL_MODIFIERS,
      roundingMethod,
    });
    pureBaseCp = pureResult.activeCp;
  } else {
    pureBaseCp = activeCp;
  }

  const accountBonusCp = activeCp - pureBaseCp;

  return {
    rawLevelBase,
    scaledTotal,
    str,
    dex,
    mag,
    sta,
    sumPotential,
    speed,
    potHp,
    potMatchingAtk,
    potPDef,
    potMDef,
    potHit,
    potEva,
    potCrit,
    potCritRes,
    potDebuffHit,
    rankBonus,
    finalHp,
    finalAtk,
    finalDef,
    finalPDef,
    finalMDef,
    finalHit,
    finalEva,
    finalCrit,
    finalCritRes,
    finalDebuffHit,
    finalDebuffRes,
    finalPmDefBreak,
    finalDefPen,
    finalCritDmgBoostPct,
    finalPCritCutPct,
    finalMCritCutPct,
    finalCounterPct,
    finalHpDrainPct,
    speedMultiplier,
    speedCp,
    breakdown,
    totalCpFloat,
    totalCpFloor,
    totalCpFloorEach,
    totalCpRound,
    activeCp,
    roundingMethod,
    pureBaseCp,
    accountBonusCp,
  };
}
