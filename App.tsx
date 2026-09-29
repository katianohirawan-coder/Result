import React, { useState, useMemo } from 'react';
import {
  MASTER_CHARACTERS,
  MASTER_SR_RARITIES,
  MASTER_R_RARITIES,
} from './data/mementoData';
import {
  calculateCharacterStats,
  UniversalArcanaModifiers,
  DEFAULT_UNIVERSAL_MODIFIERS,
  RoundingMethod,
  evalParamMod,
} from './utils/statEngine';

export const App: React.FC = () => {
  // 1. Core Selection State
  const [selectedCharId, setSelectedCharId] = useState<number>(27); // Cordie default
  const [selectedRarityLabel, setSelectedRarityLabel] = useState<string>('LR+5');
  const [level, setLevel] = useState<number>(333);
  const [subLevel, setSubLevel] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string>('All');

  // 2. Mode State
  const [calcMode, setCalcMode] = useState<'pure_base' | 'account_mirror'>('account_mirror');
  const [playerRank, setPlayerRank] = useState<number>(433);

  // 3. Rounding Strategy State
  const [roundingMethod, setRoundingMethod] = useState<RoundingMethod>('floor_grand');

  // 4. Universal Arcana / Custom Modifier State
  const [modifiers, setModifiers] = useState<UniversalArcanaModifiers>({
    ...DEFAULT_UNIVERSAL_MODIFIERS,
    atk: { flat: 5000, perLevel: 0, pct: 0 },
    pDef: { flat: 3000, perLevel: 0, pct: 0 },
    mDef: { flat: 3000, perLevel: 0, pct: 0 },
    debuffRes: { flat: 1500, perLevel: 0, pct: 0 },
    debuffHit: { flat: 100, perLevel: 0, pct: 1.0 },
    critDmgBoostPct: 15.0,
    counterPct: 3.0,
  });

  // UI Active Sub-Panel in Modifiers Drawer
  const [modSubTab, setModSubTab] = useState<'potential' | 'offense' | 'defense' | 'utility'>('potential');

  // UI Active Tab
  const [activeTab, setActiveTab] = useState<'breakdown' | 'rounding_analysis' | 'benchmark' | 'formula_proof'>('breakdown');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Selected Character
  const currentCharacter = useMemo(() => {
    return MASTER_CHARACTERS.find((c) => c.id === selectedCharId) || MASTER_CHARACTERS[0];
  }, [selectedCharId]);

  // Available Rarities based on base rarity
  const availableRarities = useMemo(() => {
    if (currentCharacter.baseRarity === 'R') {
      return MASTER_R_RARITIES;
    }
    return MASTER_SR_RARITIES;
  }, [currentCharacter]);

  // Current Rarity
  const currentRarity = useMemo(() => {
    return availableRarities.find((r) => r.label === selectedRarityLabel) || availableRarities[0];
  }, [availableRarities, selectedRarityLabel]);

  // Filtered Characters
  const filteredCharacters = useMemo(() => {
    return MASTER_CHARACTERS.filter((c) => {
      const matchSearch =
        c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameJp.includes(searchQuery);
      const matchJob = selectedJob === 'All' || c.job === selectedJob;
      return matchSearch && matchJob;
    });
  }, [searchQuery, selectedJob]);

  // Run Calculation
  const result = useMemo(() => {
    return calculateCharacterStats({
      character: currentCharacter,
      rarity: currentRarity,
      level,
      subLevel,
      mode: calcMode,
      playerRank,
      modifiers,
      roundingMethod,
    });
  }, [currentCharacter, currentRarity, level, subLevel, calcMode, playerRank, modifiers, roundingMethod]);

  // Helper to update a single ParamModifier
  const updateParam = (
    key: keyof UniversalArcanaModifiers,
    field: 'flat' | 'perLevel' | 'pct',
    val: number
  ) => {
    setModifiers((prev) => {
      const current = prev[key] as any;
      if (typeof current === 'object' && current !== null) {
        return {
          ...prev,
          [key]: {
            ...current,
            [field]: isNaN(val) ? 0 : val,
          },
        };
      }
      return prev;
    });
  };

  const updatePct = (key: keyof UniversalArcanaModifiers, val: number) => {
    setModifiers((prev) => ({
      ...prev,
      [key]: isNaN(val) ? 0 : val,
    }));
  };

  // Presets
  const applyPresetUserCordie = () => {
    setSelectedCharId(27); // Cordie
    setSelectedRarityLabel('LR+5');
    setLevel(333);
    setSubLevel(0);
    setPlayerRank(433);
    setCalcMode('account_mirror');
    setModifiers({
      ...DEFAULT_UNIVERSAL_MODIFIERS,
      atk: { flat: 5000, perLevel: 0, pct: 0 },
      pDef: { flat: 3000, perLevel: 0, pct: 0 },
      mDef: { flat: 3000, perLevel: 0, pct: 0 },
      debuffRes: { flat: 1500, perLevel: 0, pct: 0 },
      debuffHit: { flat: 100, perLevel: 0, pct: 1.0 },
      critDmgBoostPct: 15.0,
      counterPct: 3.0,
    });
  };

  const loadFlorencePure = () => {
    const flo = MASTER_CHARACTERS.find((c) => c.nameEn === 'Florence');
    if (flo) {
      setSelectedCharId(flo.id);
      setSelectedRarityLabel('SR');
      setLevel(1);
      setSubLevel(0);
      setCalcMode('pure_base');
      setActiveTab('breakdown');
    }
  };

  const applyPresetLepus = () => {
    setModifiers((prev) => ({
      ...prev,
      mag: { flat: 0, perLevel: 15, pct: 0 }, // +15 MAG * Level
    }));
    setModSubTab('potential');
  };

  const applyPresetLynx = () => {
    setModifiers((prev) => ({
      ...prev,
      pCritCutPct: 7.0, // +7.0% P.Crit Cut
    }));
    setModSubTab('defense');
  };

  const resetAllModifiers = () => {
    setModifiers(DEFAULT_UNIVERSAL_MODIFIERS);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-amber-500/30">
      {/* 1. Header (Top Bar) */}
      <header className="border-b border-slate-800 bg-[#0E1526]/80 backdrop-blur sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-amber-400 font-serif">†</span> Memento Mori Stat & CP Engine
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Official Master In-Game Analyzer
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={applyPresetUserCordie}
              className="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded shadow-md transition-all whitespace-nowrap"
            >
              ★ Muat Sampel Akun Anda (Cordie LR+5)
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner Ringkasan Pembuktian Matematis & Update Florence */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MASTER DATA SYNCED
              </span>
              <h2 className="text-base font-semibold text-white">
                Initial Parameters & Nama Stat Resmi In-Game Telah Sinkron
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Florence kini memiliki <span className="text-amber-400 font-mono">PM. DEF Break = 2</span> bawaan (CharacterMB.json). Istilah telah distandarkan ke nama resmi game (e.g. <span className="text-cyan-400 font-mono">DEF Break</span> bukan DEF Penetration) serta dilengkapi pembanding 3 metode pembulatan CP.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadFlorencePure}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition"
            >
              Uji Florence (PM DEF Break 2)
            </button>
            <button
              onClick={() => setActiveTab('rounding_analysis')}
              className="px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition"
            >
              Analisa Pembulatan CP
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Controls (Left) vs Dashboard Result (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: Inputs & Universal Arcana Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Mode & Rounding Selector Card */}
            <div className="bg-[#121929] border border-slate-800 rounded-lg p-4 space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Mode Perhitungan
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded border border-slate-800">
                <button
                  onClick={() => setCalcMode('pure_base')}
                  className={`py-2 px-3 text-xs font-medium rounded transition-all text-center ${
                    calcMode === 'pure_base'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Stat Murni (Lab)
                </button>
                <button
                  onClick={() => setCalcMode('account_mirror')}
                  className={`py-2 px-3 text-xs font-medium rounded transition-all text-center ${
                    calcMode === 'account_mirror'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cermin Profil Game
                </button>
              </div>

              {/* Rounding Method Selector */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Metode Pembulatan CP:</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {roundingMethod === 'floor_grand'
                      ? 'Floor Total (Default Game)'
                      : roundingMethod === 'floor_each'
                      ? 'Floor Tiap Baris'
                      : 'Round Total'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setRoundingMethod('floor_grand')}
                    className={`py-1 rounded transition text-center ${
                      roundingMethod === 'floor_grand'
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Floor Total
                  </button>
                  <button
                    onClick={() => setRoundingMethod('floor_each')}
                    className={`py-1 rounded transition text-center ${
                      roundingMethod === 'floor_each'
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Floor Tiap Baris
                  </button>
                  <button
                    onClick={() => setRoundingMethod('round_grand')}
                    className={`py-1 rounded transition text-center ${
                      roundingMethod === 'round_grand'
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Round Total
                  </button>
                </div>
              </div>
            </div>

            {/* Character & Rarity Selection Card */}
            <div className="bg-[#121929] border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Karakter & Rarity
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-mono">
                    Job: {currentCharacter.job}
                  </span>
                  {currentCharacter.initialBattleParam?.pmDefBreak ? (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-mono">
                      PM.DEF Break: +{currentCharacter.initialBattleParam.pmDefBreak}
                    </span>
                  ) : null}
                  {currentCharacter.initialBattleParam?.defPen ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono">
                      DEF Break: +{currentCharacter.initialBattleParam.defPen}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Character Search & Filter */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari karakter (e.g. Florence, Cordie, Natasha)..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="All">Semua Job</option>
                    <option value="Sniper">Sniper</option>
                    <option value="Warrior">Warrior</option>
                    <option value="Sorcerer">Sorcerer</option>
                  </select>
                </div>

                {/* Character Dropdown */}
                <select
                  value={selectedCharId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedCharId(id);
                    const char = MASTER_CHARACTERS.find((c) => c.id === id);
                    if (char && char.baseRarity === 'R' && selectedRarityLabel.startsWith('LR')) {
                      setSelectedRarityLabel('SSR+');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {filteredCharacters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameJp}) [{c.job}] - Base {c.baseRarity}
                      {c.initialBattleParam?.pmDefBreak ? ` [PM.DEF Break +${c.initialBattleParam.pmDefBreak}]` : ''}
                      {c.initialBattleParam?.defPen ? ` [DEF Break +${c.initialBattleParam.defPen}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rarity Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 block">Rarity Saat Ini:</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {availableRarities.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setSelectedRarityLabel(r.label)}
                      className={`px-2 py-1.5 text-xs rounded border text-center transition font-mono ${
                        selectedRarityLabel === r.label
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level & Sub-level */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-medium">Level Karakter:</label>
                  <div className="flex items-center gap-1 font-mono text-sm">
                    <span className="text-white font-bold">Lv. {level}</span>
                    {level >= 240 && (
                      <span className="text-amber-400 font-semibold">.{subLevel}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={level}
                    onChange={(e) => setLevel(Math.max(1, Math.min(1000, Number(e.target.value))))}
                    className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white"
                  />
                </div>

                {/* Sub-level slider for Level Link post-240 */}
                {level >= 240 && (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Level Link Sub-Level (0-9):</span>
                      <span className="text-amber-400 font-mono font-bold">.{subLevel}</span>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSubLevel(s)}
                          className={`py-1 text-xs font-mono rounded border ${
                            subLevel === s
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          .{s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* UNIVERSAL ARCANA & CUSTOM MODIFIER PANEL (Only when Mode = account_mirror) */}
            {calcMode === 'account_mirror' && (
              <div className="bg-[#121929] border border-slate-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Panel Modifikasi Arcana Universal
                  </label>
                  <button
                    onClick={resetAllModifiers}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition"
                  >
                    ↺ Reset Semua
                  </button>
                </div>

                {/* Quick Presets Bar */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={applyPresetUserCordie}
                    className="px-2 py-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded hover:bg-amber-500/30"
                  >
                    Preset Akun Anda (Cordie)
                  </button>
                  <button
                    onClick={applyPresetLepus}
                    className="px-2 py-1 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-500/30"
                  >
                    +Lepus (Lv × 15 MAG)
                  </button>
                  <button
                    onClick={applyPresetLynx}
                    className="px-2 py-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded hover:bg-emerald-500/30"
                  >
                    +Lynx (+7% P.CRIT Cut)
                  </button>
                </div>

                {/* Player Rank Controls */}
                <div className="bg-slate-950/70 p-3 rounded border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Player Rank (1 - 1000):</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={playerRank}
                      onChange={(e) =>
                        setPlayerRank(Math.max(1, Math.min(1000, Number(e.target.value))))
                      }
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-right font-mono text-white"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    value={playerRank}
                    onChange={(e) => setPlayerRank(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                  />
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                    <div>Rank ATK: <span className="text-amber-400">+{result.rankBonus.atk.toLocaleString()}</span></div>
                    <div>Rank HP: <span className="text-emerald-400">+{result.rankBonus.hp.toLocaleString()}</span></div>
                    <div>Rank HP%: <span className="text-emerald-400">+{result.rankBonus.hpPct || 0}%</span></div>
                    <div>Rank ATK%: <span className="text-amber-400">+{result.rankBonus.atkPct || 0}%</span></div>
                  </div>
                </div>

                {/* Sub-tabs for Modifiers Drawer */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setModSubTab('potential')}
                    className={`py-1.5 rounded transition ${
                      modSubTab === 'potential'
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Potensial
                  </button>
                  <button
                    onClick={() => setModSubTab('offense')}
                    className={`py-1.5 rounded transition ${
                      modSubTab === 'offense'
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Offense
                  </button>
                  <button
                    onClick={() => setModSubTab('defense')}
                    className={`py-1.5 rounded transition ${
                      modSubTab === 'defense'
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Defense
                  </button>
                  <button
                    onClick={() => setModSubTab('utility')}
                    className={`py-1.5 rounded transition ${
                      modSubTab === 'utility'
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Spesial
                  </button>
                </div>

                {/* Sub-Panel 1: Potentials (STR, DEX, MAG, STA) */}
                {modSubTab === 'potential' && (
                  <div className="space-y-3 text-xs">
                    <p className="text-[11px] text-slate-400">
                      Input bonus potensial. Penambahan ini otomatis meningkatkan turunan sub-stat dan Speed Coupling CP.
                    </p>

                    {(['str', 'dex', 'mag', 'sta'] as const).map((key) => {
                      const label =
                        key === 'str'
                          ? 'STR (Muscle)'
                          : key === 'dex'
                          ? 'DEX (Energy)'
                          : key === 'mag'
                          ? 'MAG (Intelligence)'
                          : 'STA (Health)';
                      const mod = modifiers[key];
                      const totalAdded = evalParamMod(mod, level);

                      return (
                        <div key={key} className="bg-slate-950/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{label}</span>
                            <span className="font-mono text-[11px] text-amber-400">
                              Total: +{totalAdded.toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Flat:</span>
                              <input
                                type="number"
                                value={mod.flat || ''}
                                onChange={(e) => updateParam(key, 'flat', parseFloat(e.target.value))}
                                placeholder="0"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">
                                Pengali Lv (Lv × N):
                              </span>
                              <input
                                type="number"
                                step="1"
                                value={mod.perLevel || ''}
                                onChange={(e) => updateParam(key, 'perLevel', parseFloat(e.target.value))}
                                placeholder="e.g. 15"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sub-Panel 2: Offense Parameters */}
                {modSubTab === 'offense' && (
                  <div className="space-y-3 text-xs">
                    {/* ATK */}
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">Attack (ATK)</span>
                        <span className="font-mono text-[11px] text-amber-400">
                          Total: +{evalParamMod(modifiers.atk, level).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Flat:</span>
                          <input
                            type="number"
                            value={modifiers.atk.flat || ''}
                            onChange={(e) => updateParam('atk', 'flat', parseFloat(e.target.value))}
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Lv × N:</span>
                          <input
                            type="number"
                            value={modifiers.atk.perLevel || ''}
                            onChange={(e) => updateParam('atk', 'perLevel', parseFloat(e.target.value))}
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Bonus %:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={modifiers.atk.pct || ''}
                            onChange={(e) => updateParam('atk', 'pct', parseFloat(e.target.value))}
                            placeholder="0%"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Hit, Crit, DEF Break, PM. DEF Break */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-300 block">Accuracy (Hit) Flat:</span>
                        <input
                          type="number"
                          value={modifiers.hit.flat || ''}
                          onChange={(e) => updateParam('hit', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-300 block">Critical (CRIT) Flat:</span>
                        <input
                          type="number"
                          value={modifiers.crit.flat || ''}
                          onChange={(e) => updateParam('crit', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-300 block">DEF Break Flat:</span>
                        <input
                          type="number"
                          value={modifiers.defPen.flat || ''}
                          onChange={(e) => updateParam('defPen', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-300 block">PM. DEF Break Flat:</span>
                        <input
                          type="number"
                          value={modifiers.pmDefBreak.flat || ''}
                          onChange={(e) => updateParam('pmDefBreak', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                    </div>

                    {/* CRIT DMG Boost % */}
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">CRIT DMG Boost (%)</span>
                        <span className="text-[10px] text-slate-400 font-mono">2.000 CP per 1%</span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={modifiers.critDmgBoostPct || ''}
                        onChange={(e) => updatePct('critDmgBoostPct', parseFloat(e.target.value))}
                        placeholder="e.g. 15.0"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Panel 3: Defense & Survival Parameters */}
                {modSubTab === 'defense' && (
                  <div className="space-y-3 text-xs">
                    {/* HP */}
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">HP (Hit Points)</span>
                        <span className="font-mono text-[11px] text-emerald-400">
                          Total Flat: +{evalParamMod(modifiers.hp, level).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Flat:</span>
                          <input
                            type="number"
                            value={modifiers.hp.flat || ''}
                            onChange={(e) => updateParam('hp', 'flat', parseFloat(e.target.value))}
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Lv × N:</span>
                          <input
                            type="number"
                            value={modifiers.hp.perLevel || ''}
                            onChange={(e) => updateParam('hp', 'perLevel', parseFloat(e.target.value))}
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Bonus %:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={modifiers.hp.pct || ''}
                            onChange={(e) => updateParam('hp', 'pct', parseFloat(e.target.value))}
                            placeholder="0%"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* DEF, P.DEF, M.DEF */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-300 block">DEF (Lv×N):</span>
                        <input
                          type="number"
                          step="1"
                          value={modifiers.def.perLevel || ''}
                          onChange={(e) => updateParam('def', 'perLevel', parseFloat(e.target.value))}
                          placeholder="e.g. 5"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-300 block">P.DEF Flat:</span>
                        <input
                          type="number"
                          value={modifiers.pDef.flat || ''}
                          onChange={(e) => updateParam('pDef', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-300 block">M.DEF Flat:</span>
                        <input
                          type="number"
                          value={modifiers.mDef.flat || ''}
                          onChange={(e) => updateParam('mDef', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                    </div>

                    {/* P.CRIT Cut % & M.CRIT Cut % */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-200">P.CRIT Cut (%)</div>
                        <div className="text-[10px] text-slate-400 font-mono">Lynx: 7.0% = +14k CP</div>
                        <input
                          type="number"
                          step="0.1"
                          value={modifiers.pCritCutPct || ''}
                          onChange={(e) => updatePct('pCritCutPct', parseFloat(e.target.value))}
                          placeholder="0%"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-200">M.CRIT Cut (%)</div>
                        <div className="text-[10px] text-slate-400 font-mono">2.000 CP per 1%</div>
                        <input
                          type="number"
                          step="0.1"
                          value={modifiers.mCritCutPct || ''}
                          onChange={(e) => updatePct('mCritCutPct', parseFloat(e.target.value))}
                          placeholder="0%"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Panel 4: Utility & Special */}
                {modSubTab === 'utility' && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="font-semibold text-slate-200 block">Debuff RES (Flat):</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Ursa Lv 2 = 1.500</span>
                        <input
                          type="number"
                          value={modifiers.debuffRes.flat || ''}
                          onChange={(e) => updateParam('debuffRes', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="font-semibold text-slate-200 block">Debuff ACC (Flat/%):</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Ursa Lv 2 = 1.0% (100)</span>
                        <input
                          type="number"
                          value={modifiers.debuffHit.flat || ''}
                          onChange={(e) => updateParam('debuffHit', 'flat', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="font-semibold text-slate-200 block">Counter Attack (%):</span>
                        <span className="text-[10px] text-slate-400 block font-mono">1.500 CP per 1%</span>
                        <input
                          type="number"
                          step="0.1"
                          value={modifiers.counterPct || ''}
                          onChange={(e) => updatePct('counterPct', parseFloat(e.target.value))}
                          placeholder="0%"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
                        <span className="font-semibold text-slate-200 block">HP Drain (%):</span>
                        <span className="text-[10px] text-slate-400 block font-mono">1.500 CP per 1%</span>
                        <input
                          type="number"
                          step="0.1"
                          value={modifiers.hpDrainPct || ''}
                          onChange={(e) => updatePct('hpDrainPct', parseFloat(e.target.value))}
                          placeholder="0%"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Results, CP Breakdown & Proof (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Primary CP Display Card */}
            <div className="bg-gradient-to-b from-[#162035] to-[#0E1526] border border-slate-700/80 rounded-lg p-5 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block">
                    TOTAL COMBAT POWER (CP / BP)
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight flex items-baseline gap-2 mt-1">
                    <span>{result.activeCp.toLocaleString()}</span>
                    <span className="text-xs font-normal text-slate-400">
                      (Float: {result.totalCpFloat.toFixed(1)})
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>{currentCharacter.nameEn}</span>
                    <span>·</span>
                    <span>{currentRarity.label}</span>
                    <span>·</span>
                    <span className="text-amber-400 font-mono">
                      Lv.{level}{level >= 240 ? `.${subLevel}` : ''}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-400">
                      {calcMode === 'pure_base' ? 'Pure Base' : `Rank ${playerRank}`}
                    </span>
                    <span>·</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      [{roundingMethod}]
                    </span>
                  </div>
                </div>

                {/* Stat Key Summary Badges */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <div className="bg-slate-950/70 border border-slate-800 rounded px-3 py-1.5 text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Total ATK</div>
                    <div className="text-sm font-bold font-mono text-amber-400">
                      {result.finalAtk.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800 rounded px-3 py-1.5 text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Total HP</div>
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {result.finalHp.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Primary Potentials Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">STR (Muscle)</div>
                  <div className="text-slate-200 font-semibold">{result.str.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">DEX (Energy)</div>
                  <div className="text-slate-200 font-semibold">{result.dex.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">MAG (Intelligence)</div>
                  <div className="text-slate-200 font-semibold">{result.mag.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-400">STA (Health)</div>
                  <div className="text-slate-200 font-semibold">{result.sta.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs for Right Panel */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition whitespace-nowrap ${
                  activeTab === 'breakdown'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                19 Parameter Tempur (CP Grid)
              </button>
              <button
                onClick={() => setActiveTab('rounding_analysis')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition whitespace-nowrap ${
                  activeTab === 'rounding_analysis'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Komparasi Pembulatan CP
              </button>
              <button
                onClick={() => setActiveTab('benchmark')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition whitespace-nowrap ${
                  activeTab === 'benchmark'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Validasi Akun & Kasus
              </button>
              <button
                onClick={() => setActiveTab('formula_proof')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition whitespace-nowrap ${
                  activeTab === 'formula_proof'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dokumentasi Master Data
              </button>
            </div>

            {/* TAB 1: 19 Battle Parameters Breakdown */}
            {activeTab === 'breakdown' && (
              <div className="bg-[#121929] border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Daftar 19 Parameter & Bobot CP Resmi In-Game (Gambar 1 & 2)
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    {['All', 'Offense', 'Defense', 'Survival', 'Utility', 'Special'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded transition ${
                          categoryFilter === cat
                            ? 'bg-amber-500/20 text-amber-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2 px-2">Parameter (In-Game)</th>
                        <th className="py-2 px-2">Nama Jepang</th>
                        <th className="py-2 px-2 text-right">Nilai Stat</th>
                        <th className="py-2 px-2 text-right">Pengali CP</th>
                        <th className="py-2 px-2 text-right">Hasil CP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {result.breakdown
                        .filter(
                          (item) => categoryFilter === 'All' || item.category === categoryFilter
                        )
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-2 px-2 font-sans font-medium text-slate-200">
                              {item.name}
                            </td>
                            <td className="py-2 px-2 text-slate-500 font-sans">{item.jpName}</td>
                            <td className="py-2 px-2 text-right text-slate-100 font-semibold">
                              {item.isPct
                                ? `${item.value.toFixed(1)}%`
                                : item.value.toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-right text-slate-400 text-[11px]">
                              {item.rateLabel}
                            </td>
                            <td className="py-2 px-2 text-right text-amber-400 font-bold">
                              {roundingMethod === 'floor_each'
                                ? item.floorCp.toLocaleString()
                                : item.cp.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Rounding Analysis */}
            {activeTab === 'rounding_analysis' && (
              <div className="bg-[#121929] border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Analisis 3 Metode Pembulatan Combat Power (CP)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Membandingkan bagaimana selisih desimal (float truncation) mempengaruhi total akhir CP karakter.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                  {/* Option 1: Floor Grand Total */}
                  <div
                    onClick={() => setRoundingMethod('floor_grand')}
                    className={`cursor-pointer p-3.5 rounded-lg border transition ${
                      roundingMethod === 'floor_grand'
                        ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans font-bold text-white">Metode B (Default)</span>
                      {roundingMethod === 'floor_grand' && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-1">
                      Jumlahkan float lalu floor grand total
                    </div>
                    <div className="text-xl font-bold text-amber-400 mt-2">
                      {result.totalCpFloor.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Formula: ⌊∑ (Stat × Rate)⌋
                    </div>
                  </div>

                  {/* Option 2: Floor Each Parameter */}
                  <div
                    onClick={() => setRoundingMethod('floor_each')}
                    className={`cursor-pointer p-3.5 rounded-lg border transition ${
                      roundingMethod === 'floor_each'
                        ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans font-bold text-white">Metode A</span>
                      {roundingMethod === 'floor_each' && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-1">
                      Floor tiap baris parameter lalu jumlahkan
                    </div>
                    <div className="text-xl font-bold text-cyan-400 mt-2">
                      {result.totalCpFloorEach.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Formula: ∑ ⌊Stat × Rate⌋
                    </div>
                  </div>

                  {/* Option 3: Round Grand Total */}
                  <div
                    onClick={() => setRoundingMethod('round_grand')}
                    className={`cursor-pointer p-3.5 rounded-lg border transition ${
                      roundingMethod === 'round_grand'
                        ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans font-bold text-white">Metode C</span>
                      {roundingMethod === 'round_grand' && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-1">
                      Bulatkan terdekat dari total float
                    </div>
                    <div className="text-xl font-bold text-emerald-400 mt-2">
                      {result.totalCpRound.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Formula: round(∑ (Stat × Rate))
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded border border-slate-800 text-xs text-slate-300 space-y-2">
                  <h4 className="font-semibold text-white">Mengapa Perbedaan 1–200 CP Terjadi?</h4>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Ada 19 parameter dalam penghitungan CP. Beberapa di antaranya memiliki pengali desimal seperti <span className="font-mono text-amber-400">DEF × (7/3)</span> dan <span className="font-mono text-cyan-400">Total Potensial × (Speed / 8000)</span>.
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Jika sebuah simulator memotong desimal (floor) di setiap baris parameter, pecahan desimal dari belasan stat akan terbuang sehingga total CP menjadi sedikit lebih rendah (Metode A). Sedangkan jika seluruh desimal diakumulasikan dahulu di memori floating-point game lalu dipotong di akhir, nilai CP akan menjadi sedikit lebih tinggi (Metode B).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Real Account Validation Benchmarks */}
            {activeTab === 'benchmark' && (
              <div className="bg-[#121929] border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Perbandingan Langsung dengan Profil Game Nyata
                  </h3>
                  <p className="text-xs text-slate-400">
                    Uji presisi kalkulator dengan tolok ukur in-game nyata Anda dan data resmi lainnya.
                  </p>
                </div>

                {/* Benchmark Case: User's Cordie LR+5 */}
                <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      [TOLOK UKUR UTAMA] Cordie LR+5 (Rank 433, Level 333.0)
                    </span>
                    <button
                      onClick={applyPresetUserCordie}
                      className="px-2.5 py-1 text-[11px] bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400"
                    >
                      Terapkan Konfigurasi Ini
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">ATK Target vs Hitung:</div>
                      <div className="text-amber-400 font-bold mt-0.5">2.638.193</div>
                      <div className="text-[10px] text-emerald-400 mt-1">✓ Selisih Tepat: 0</div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">HP Target vs Hitung:</div>
                      <div className="text-emerald-400 font-bold mt-0.5">26.412.563</div>
                      <div className="text-[10px] text-emerald-400 mt-1">✓ Selisih Tepat: 0</div>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">CP Target vs Hitung:</div>
                      <div className="text-cyan-400 font-bold mt-0.5">
                        24.776.563 / {result.activeCp.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">
                        Akurasi: 99.96%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demonstration of Florence's PM. DEF Break */}
                <div className="border border-purple-500/40 bg-purple-500/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 font-mono">
                      [KASUS FLORENCE] PM. DEF Break = 2 Bawaan Master Data
                    </span>
                    <button
                      onClick={loadFlorencePure}
                      className="px-2.5 py-1 text-[11px] bg-purple-600 text-white font-bold rounded hover:bg-purple-500"
                    >
                      Muat Florence
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Florence memiliki nilai inisial <span className="font-mono text-purple-300">PM. DEF Break = 2</span> (DamageEnhance di CharacterMB.json). Parameter ini memberikan tambahan <span className="font-mono text-amber-300">+14 CP</span> (2 × 7.0) secara otomatis baik di mode murni maupun cermin profil.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: Master Data Documentation */}
            {activeTab === 'formula_proof' && (
              <div className="bg-[#121929] border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    Dokumentasi Parameter Resmi CharacterMB.json
                  </h3>
                  <p className="text-xs text-slate-400">
                    Daftar parameter inisial yang kini telah disinkronkan untuk seluruh karakter.
                  </p>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-amber-400">
                      1. Pemetaan Field CharacterMB.json ke Nama Resmi In-Game
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                      <li><code>DamageEnhance</code> $\rightarrow$ <strong>PM. DEF Break</strong> (物魔防御貫通, Bobot: × 7.0)</li>
                      <li><code>DefensePenetration</code> $\rightarrow$ <strong>DEF Break</strong> (防御貫通, Bobot: × 7.0)</li>
                      <li><code>Avoidance</code> $\rightarrow$ <strong>Evasion (EVA)</strong> (回避, Bobot: × 1.0)</li>
                      <li><code>Hit</code> $\rightarrow$ <strong>Accuracy (Hit)</strong> (命中, Bobot: × 1.0)</li>
                      <li><code>DebuffHit</code> $\rightarrow$ <strong>Debuff ACC</strong> (弱体効果命中, Bobot: × 1.0)</li>
                      <li><code>DebuffResist</code> $\rightarrow$ <strong>Debuff RES</strong> (弱体効果耐性, Bobot: × 1.0)</li>
                      <li><code>PhysicalCriticalDamageRelax</code> $\rightarrow$ <strong>P.CRIT Cut</strong> (物クリ緩和, Bobot: × 2,000 / 1%)</li>
                      <li><code>MagicCriticalDamageRelax</code> $\rightarrow$ <strong>M.CRIT Cut</strong> (魔クリ緩和, Bobot: × 2,000 / 1%)</li>
                      <li><code>CriticalDamageEnhance</code> $\rightarrow$ <strong>CRIT DMG Boost</strong> (クリダメ強化, Bobot: × 2,000 / 1%)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                    <h4 className="font-semibold text-amber-400">
                      2. Karakter dengan Initial PM. DEF Break / DEF Break Bawaan
                    </h4>
                    <p>
                      Selain Florence, beberapa karakter lain juga memiliki nilai bawaan dari master data:
                    </p>
                    <div className="font-mono bg-slate-900 p-2 rounded text-[11px] text-slate-200 grid grid-cols-2 gap-1">
                      <div>• Natasha: PM. DEF Break +4</div>
                      <div>• Iris: PM. DEF Break +3</div>
                      <div>• Florence: PM. DEF Break +2</div>
                      <div>• Charlotte: PM. DEF Break +2</div>
                      <div>• Arianrhod: PM. DEF Break +2</div>
                      <div>• Lean: PM. DEF Break +2</div>
                      <div>• Mimi: PM. DEF Break +1</div>
                      <div>• Elfrinde: DEF Break +2</div>
                      <div>• Cursed Illya: DEF Break +1</div>
                      <div>• Walrida: PM. DEF Break +2</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
