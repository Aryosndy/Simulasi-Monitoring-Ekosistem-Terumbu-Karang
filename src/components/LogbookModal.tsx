import React, { useState, useEffect } from 'react';
import {
  MARINE_SPECIES,
  CORAL_LIFEFORMS,
  SURVEY_METHODS_GUIDE,
  COLLECTION_BADGES,
  WEATHER_CONFIGS,
  WEATHER_CYCLE_ORDER,
  SurveyMethodType,
  FishFunctionalGroup,
  MissionDefinition,
  WeatherType,
  TransectStationRecord,
  UvcFishLogEntry,
  calculateTransectCoralCover,
  classifyKepmenLhStatus,
  calculateFishBiomass,
} from '../game/rules';

export type LogbookTabType =
  | 'METODE_PRA_SELAM'
  | 'JENIS_KARANG'
  | 'IKAN_UVC'
  | 'LEMBAR_DATA'
  | 'MISI_CUACA';

interface LogbookModalProps {
  isOpen: boolean;
  initialTab?: LogbookTabType;
  onClose: () => void;
  selectedMethod: SurveyMethodType;
  onSelectMethod: (method: SurveyMethodType) => void;
  transectStations: TransectStationRecord[];
  uvcLogs: Record<string, UvcFishLogEntry>;
  discoveredSpeciesIds: string[];
  unlockedBadgeIds: string[];
  missions: MissionDefinition[];
  activeMissionIndex: number;
  currentWeather: WeatherType;
  onTriggerWeatherChange: (weather: WeatherType) => void;
}

export const LogbookModal: React.FC<LogbookModalProps> = ({
  isOpen,
  initialTab = 'METODE_PRA_SELAM',
  onClose,
  selectedMethod,
  onSelectMethod,
  transectStations,
  uvcLogs,
  discoveredSpeciesIds,
  unlockedBadgeIds,
  missions,
  activeMissionIndex,
  currentWeather,
  onTriggerWeatherChange,
}) => {
  const [activeTab, setActiveTab] = useState<LogbookTabType>(initialTab);
  const [fishGroupFilter, setFishGroupFilter] = useState<'ALL' | FishFunctionalGroup>('ALL');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const discoveredSet = new Set(discoveredSpeciesIds);
  const unlockedSet = new Set(unlockedBadgeIds);

  const filteredFish =
    fishGroupFilter === 'ALL'
      ? MARINE_SPECIES
      : MARINE_SPECIES.filter((s) => s.functionalGroup === fishGroupFilter);

  const pitStats = calculateTransectCoralCover(transectStations, 'PIT');
  const litStats = calculateTransectCoralCover(transectStations, 'LIT');
  const uptStats = calculateTransectCoralCover(transectStations, 'UPT');
  const activeStats =
    selectedMethod === 'LIT'
      ? litStats
      : selectedMethod === 'UPT'
      ? uptStats
      : pitStats;
  const kepmenStatus = classifyKepmenLhStatus(
    activeStats.sampledCount > 0 ? activeStats.hardCoralPct : 48.0
  );

  // Compute total UVC Fish abundance & biomass
  let totalUvcIndividuals = 0;
  let totalUvcBiomassKgHa = 0;
  for (const sp of MARINE_SPECIES) {
    const entry = uvcLogs[sp.id];
    if (entry && entry.countIndividuals > 0) {
      totalUvcIndividuals += entry.countIndividuals;
      const bio = calculateFishBiomass({
        lwA: sp.lwA,
        lwB: sp.lwB,
        lengthCm: entry.estimatedLengthCm,
        countIndividuals: entry.countIndividuals,
      });
      totalUvcBiomassKgHa += bio.biomassKgPerHa;
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-[#020B12]/90 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Briefing Pra-Penyelaman, Panduan Metode PIT LIT UPT UVC, dan Lembar Data Karang"
    >
      <div className="w-full max-w-6xl max-h-[90vh] flex flex-col bg-[#061C2C] border border-[#1E4968] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#041421] border-b border-[#163852]">
          <div>
            <h2 className="text-lg md:text-xl font-display font-bold text-[#F0FDFA]">
              Pusat Simulasi Pengambilan Data Karang (PIT · LIT · UPT) & Ikan Karang (UVC)
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Metode Aktif: <span className="font-mono-num text-[#00E5B8] font-bold">{selectedMethod}</span> · Stasiun Transek Terdata: <span className="font-mono-num text-[#38BDF8] font-bold">{pitStats.sampledCount}/{pitStats.totalStations}</span> · Spesies Ikan UVC: <span className="font-mono-num text-[#FACC15] font-bold">{discoveredSet.size}/{MARINE_SPECIES.length}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#00E5B8] hover:bg-[#14F1C6] text-[#03141F] text-xs font-display font-bold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            Kembali ke Penyelaman [Esc / B]
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-6 py-3 bg-[#051826] border-b border-[#123047]">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'METODE_PRA_SELAM', label: '1. Briefing Metode (PIT / LIT / UPT / UVC)' },
                { id: 'JENIS_KARANG', label: `2. Jenis Karang & Lifeform (${CORAL_LIFEFORMS.length})` },
                { id: 'IKAN_UVC', label: `3. Jenis Ikan Karang UVC (${discoveredSet.size}/${MARINE_SPECIES.length})` },
                { id: 'LEMBAR_DATA', label: `4. Lembar Data Transek (${pitStats.sampledCount}/${pitStats.totalStations})` },
                { id: 'MISI_CUACA', label: '5. Misi & Cuaca Dinamis' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#00E5B8] text-[#03141F]'
                    : 'bg-[#0A253A] text-[#94A3B8] hover:text-[#F0FDFA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ================================================================ */}
          {/* TAB 1: PRE-DIVE BRIEFING & SCIENTIFIC METHODS (PIT, LIT, UPT, UVC) */}
          {/* ================================================================ */}
          {activeTab === 'METODE_PRA_SELAM' && (
            <div className="space-y-6">
              <div className="bg-[#082438] border border-[#1E4E70] rounded-xl p-4">
                <h3 className="text-base font-display font-bold text-[#00E5B8]">
                  Protokol Persiapan Sebelum Penyelaman (Pre-Dive Scientific Briefing)
                </h3>
                <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                  Sebelum turun ke kedalaman transek (5m–10m), tim peneliti wajib menyamakan persepsi kode kategori <strong>Benthic Lifeform</strong> (karang Acropora vs Non-Acropora vs Abiotik), mengkalibrasi estimasi ukuran panjang ikan bawah air (efek pembiasan kaca masker memperbesar objek ~25%), dan memilih metode pengambilan data. Klik salah satu metode di bawah untuk mengaktifkannya sebagai alat utama penyelaman Anda:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['PIT', 'LIT', 'UPT', 'UVC'] as SurveyMethodType[]).map((mKey) => {
                  const guide = SURVEY_METHODS_GUIDE[mKey];
                  const isSelected = selectedMethod === mKey;
                  return (
                    <div
                      key={guide.id}
                      className={`p-5 rounded-xl border flex flex-col justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#0A2D46] border-[#00E5B8] shadow-[0_0_20px_rgba(0,229,184,0.18)]'
                          : 'bg-[#072032] border-[#163D59]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-mono-num font-bold text-[#00E5B8]">
                              METODE {guide.code}
                            </span>
                            <h4 className="text-lg font-display font-bold text-[#F0FDFA]">
                              {guide.indonesianTitle}
                            </h4>
                            <div className="text-xs text-[#7DD3FC]">{guide.fullName}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectMethod(guide.id)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                              isSelected
                                ? 'bg-[#00E5B8] text-[#03141F]'
                                : 'bg-[#0E3652] text-[#E2F1F8] hover:bg-[#164A6E]'
                            }`}
                          >
                            {isSelected ? 'Metode Aktif' : `Gunakan ${guide.code}`}
                          </button>
                        </div>

                        <p className="text-xs text-[#CBD5E1] mt-3 leading-relaxed">
                          <strong className="text-[#F0FDFA]">Tujuan Ilmiah:</strong> {guide.scientificPurpose}
                        </p>

                        <div className="mt-3 p-2.5 bg-[#041522] rounded-lg border border-[#143750]">
                          <div className="text-[11px] font-bold text-[#38BDF8] mb-1">
                            Spesifikasi Bentangan Transek:
                          </div>
                          <p className="text-xs text-[#E2F1F8] leading-snug">{guide.transectSpec}</p>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs font-bold text-[#F0FDFA] mb-1">
                            Alat Selam & Instrumen Survei:
                          </div>
                          <div className="text-xs text-[#94A3B8]">
                            {guide.equipmentList.join(' · ')}
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs font-bold text-[#00E5B8] mb-1">
                            Tahapan Sebelum Penyelaman (Pre-Dive):
                          </div>
                          <ul className="space-y-1 text-xs text-[#CBD5E1]">
                            {guide.preDiveProcedure.map((step, i) => (
                              <li key={i}>
                                {i + 1}. {step}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-3">
                          <div className="text-xs font-bold text-[#38BDF8] mb-1">
                            Prosedur Pengambilan Data di Bawah Air:
                          </div>
                          <ul className="space-y-1 text-xs text-[#CBD5E1]">
                            {guide.inWaterProcedure.map((step, i) => (
                              <li key={i}>
                                {i + 1}. {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#163D59] font-mono-num text-xs text-[#FACC15]">
                        Rumus Baku: {guide.formulaText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: CORAL LIFEFORM IDENTIFICATION GUIDE (AIMS / COREMAP)      */}
          {/* ================================================================ */}
          {activeTab === 'JENIS_KARANG' && (
            <div className="space-y-4">
              <div className="bg-[#082438] border border-[#1E4E70] rounded-xl p-4">
                <h3 className="text-base font-display font-bold text-[#00E5B8]">
                  Klasifikasi Bentuk Pertumbuhan Karang (Benthic Lifeform — Standar AIMS & COREMAP)
                </h3>
                <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                  Dalam metode <strong>PIT, LIT, dan UPT</strong>, karang diidentifikasi berdasarkan bentuk morfologi koloni (Lifeform) dan struktur koralitnya: kelompok <strong>Acropora</strong> memiliki <em>koralit aksial</em> di ujung cabang serta <em>koralit radial</em> di sisi cabang, sedangkan kelompok <strong>Non-Acropora</strong> tidak memiliki koralit aksial. Tutupan <strong>Karang Keras Hidup (Hard Coral / HC)</strong> adalah penjumlahan seluruh kategori Acropora + Non-Acropora.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CORAL_LIFEFORMS.map((coral) => (
                  <div
                    key={coral.code}
                    className="p-4 rounded-xl bg-[#072032] border border-[#184361] flex items-start gap-4"
                  >
                    {/* Custom Anatomical SVG Illustration per Coral Shape */}
                    <div className="w-16 h-16 rounded-lg bg-[#041421] border border-[#1D4E70] flex flex-col items-center justify-center shrink-0 p-1">
                      <svg viewBox="0 0 56 56" className="w-11 h-11">
                        {coral.shapeType === 'BRANCHING' && (
                          <g stroke="#03101A" strokeWidth="1.8" fill={coral.colorPrimary}>
                            <path d="M28 50 L28 14 M28 36 L14 20 M28 32 L42 18 M20 27 L12 12 M36 25 L44 10" stroke={coral.colorPrimary} strokeWidth="5" strokeLinecap="round" />
                            <circle cx="28" cy="12" r="3" fill={coral.colorSecondary} />
                            <circle cx="12" cy="11" r="2.5" fill={coral.colorSecondary} />
                            <circle cx="44" cy="9" r="2.5" fill={coral.colorSecondary} />
                          </g>
                        )}
                        {coral.shapeType === 'TABULATE' && (
                          <g>
                            <rect x="23" y="34" width="10" height="16" rx="2" fill={coral.colorPrimary} />
                            <ellipse cx="28" cy="30" rx="22" ry="6" fill={coral.colorPrimary} stroke={coral.colorSecondary} strokeWidth="2" />
                            <ellipse cx="28" cy="21" rx="16" ry="5" fill={coral.colorPrimary} stroke={coral.colorSecondary} strokeWidth="1.5" />
                          </g>
                        )}
                        {coral.shapeType === 'MASSIVE' && (
                          <g>
                            <path d="M8 46 A20 20 0 0 1 48 46 Z" fill={coral.colorPrimary} stroke="#03101A" strokeWidth="2" />
                            <path d="M16 40 Q28 28 40 40 M20 33 Q28 24 36 33" stroke={coral.colorSecondary} strokeWidth="2" fill="none" />
                          </g>
                        )}
                        {coral.shapeType === 'FOLIOSE' && (
                          <g fill={coral.colorPrimary} stroke={coral.colorSecondary} strokeWidth="1.5">
                            <ellipse cx="20" cy="34" rx="12" ry="8" />
                            <ellipse cx="36" cy="34" rx="12" ry="8" />
                            <ellipse cx="28" cy="26" rx="14" ry="9" />
                          </g>
                        )}
                        {coral.shapeType === 'MUSHROOM' && (
                          <g>
                            <ellipse cx="28" cy="32" rx="20" ry="11" fill={coral.colorPrimary} stroke="#03101A" strokeWidth="2" />
                            <line x1="8" y1="32" x2="48" y2="32" stroke={coral.colorSecondary} strokeWidth="1.5" />
                            <line x1="28" y1="21" x2="28" y2="43" stroke={coral.colorSecondary} strokeWidth="1.5" />
                            <line x1="14" y1="24" x2="42" y2="40" stroke={coral.colorSecondary} strokeWidth="1.5" />
                            <line x1="42" y1="24" x2="14" y2="40" stroke={coral.colorSecondary} strokeWidth="1.5" />
                          </g>
                        )}
                        {(coral.shapeType === 'SUBMASSIVE' || coral.shapeType === 'SOFT' || coral.shapeType === 'RUBBLE_DEAD') && (
                          <g fill={coral.colorPrimary} stroke="#03101A" strokeWidth="1.5">
                            <rect x="14" y="22" width="7" height="24" rx="3.5" />
                            <rect x="24" y="16" width="8" height="30" rx="4" />
                            <rect x="35" y="24" width="7" height="22" rx="3.5" />
                          </g>
                        )}
                      </svg>
                      <span className="font-mono-num text-[11px] font-extrabold text-[#F0FDFA]">
                        {coral.code}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-display font-bold text-[#F0FDFA]">
                          [{coral.code}] {coral.indonesianName}
                        </h4>
                        <span
                          className={`text-xs font-mono-num font-bold shrink-0 ${
                            coral.isHardCoral ? 'text-[#00E5B8]' : 'text-[#F59E0B]'
                          }`}
                        >
                          {coral.isHardCoral ? 'Karang Keras (HC)' : coral.categoryGroup.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-[#7DD3FC] mt-0.5">
                        Nama Standar: <strong>{coral.name}</strong> · Contoh Genus: <i>{coral.exampleGenus}</i>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-xs text-[#CBD5E1] leading-relaxed">
                        <p>
                          <strong className="text-[#F0FDFA]">Ciri Morfologi:</strong> {coral.morphologyDescription}
                        </p>
                        <p>
                          <strong className="text-[#00E5B8]">Indikator Ekologis:</strong> {coral.ecologicalIndicator}
                        </p>
                        <p>
                          <strong className="text-[#38BDF8]">Zona Kedalaman:</strong> {coral.depthDistribution}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: REEF FISH UVC CATALOG (INDIKATOR, TARGET, MAYOR)          */}
          {/* ================================================================ */}
          {activeTab === 'IKAN_UVC' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#082438] border border-[#1E4E70] rounded-xl p-4">
                <div className="max-w-2xl">
                  <h3 className="text-base font-display font-bold text-[#00E5B8]">
                    Pengelompokan Ikan Karang dalam Sensus Visual UVC (Belt Transect 50m × 5m)
                  </h3>
                  <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                    Metode <strong>UVC</strong> membagi ikan karang ke dalam 3 kelompok fungsional utama: <strong>1. Ikan Indikator (Chaetodontidae)</strong> penanda kesehatan karang hidup, <strong>2. Ikan Target (Ekonomis/Herbivora Kunci)</strong> untuk estimasi stok biomassa ($W = a \cdot L^b$), dan <strong>3. Ikan Mayor (Pomacentridae)</strong> penghuni padat koloni karang.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'ALL', label: 'Semua Kelompok (12)' },
                      { id: 'INDIKATOR', label: 'Ikan Indikator (3)' },
                      { id: 'TARGET', label: 'Ikan Target / Ekonomis (6)' },
                      { id: 'MAYOR', label: 'Ikan Mayor (3)' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFishGroupFilter(f.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                        fishGroupFilter === f.id
                          ? 'bg-[#00E5B8] text-[#03141F]'
                          : 'bg-[#051826] text-[#94A3B8] hover:text-[#F0FDFA]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFish.map((species) => {
                  const isDiscovered = discoveredSet.has(species.id);
                  const logEntry = uvcLogs[species.id];
                  const countRecorded = logEntry?.countIndividuals ?? 0;
                  const bioStats = calculateFishBiomass({
                    lwA: species.lwA,
                    lwB: species.lwB,
                    lengthCm: logEntry?.estimatedLengthCm ?? species.meanLengthCm,
                    countIndividuals: Math.max(1, countRecorded),
                  });

                  return (
                    <div
                      key={species.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        isDiscovered
                          ? 'bg-[#082438] border-[#1F567C]'
                          : 'bg-[#051826] border-[#113148]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-[#041421] border border-[#1E4968] flex flex-col items-center justify-center shrink-0">
                          <svg viewBox="0 0 56 44" className="w-12 h-10">
                            <ellipse
                              cx="25"
                              cy="22"
                              rx="16"
                              ry="10"
                              fill={species.colorPrimary}
                              stroke={species.colorSecondary}
                              strokeWidth="2"
                            />
                            {species.patternType === 'STRIPED' && (
                              <g stroke={species.colorSecondary} strokeWidth="2.5">
                                <line x1="18" y1="13" x2="18" y2="31" />
                                <line x1="26" y1="12" x2="26" y2="32" />
                                <line x1="33" y1="14" x2="33" y2="30" />
                              </g>
                            )}
                            {species.patternType === 'CHEVRON' && (
                              <path
                                d="M18 16 L24 22 L18 28 M26 15 L32 22 L26 29"
                                stroke={species.colorSecondary}
                                strokeWidth="2"
                                fill="none"
                              />
                            )}
                            <polygon
                              points="39,22 50,13 47,22 50,31"
                              fill={species.colorSecondary}
                            />
                            <circle cx="16" cy="19" r="2.2" fill="#FFFFFF" />
                            <circle cx="15.5" cy="19" r="1.1" fill="#03101A" />
                          </svg>
                          <span className="text-[10px] font-mono-num font-bold text-[#7DD3FC]">
                            {species.functionalGroup}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-base font-display font-bold text-[#F0FDFA] truncate">
                              {species.name}
                            </h4>
                            <span className="font-mono-num text-xs font-bold text-[#00E5B8] shrink-0">
                              {countRecorded > 0 ? `Terdata: ${countRecorded} ind` : `+${species.pointsBonus} PTS`}
                            </span>
                          </div>

                          <div className="text-xs text-[#7DD3FC] mt-0.5">
                            <i>{species.scientificName}</i> · Famili: <strong>{species.family}</strong> · {species.functionalGroupLabel}
                          </div>

                          <div className="mt-2.5 space-y-1 text-xs text-[#CBD5E1] leading-relaxed">
                            <p>
                              <strong className="text-[#FACC15]">Kunci Identifikasi Visual:</strong> {species.identificationKey}
                            </p>
                            <p>
                              <strong className="text-[#00E5B8]">Peran & Fakta Bio-Ekologi:</strong> {species.faktaMenarik}
                            </p>
                            <p className="font-mono-num text-[11px] text-[#94A3B8]">
                              Panjang Rata-Rata (TL): {species.meanLengthCm} cm · Konstanta Allometrik: a={species.lwA}, b={species.lwB} · Bobot Individu: ~{bioStats.singleWeightGrams}g
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: LIVE SCIENTIFIC TRANSECT DATA SHEET (SABAK BAWAH AIR)     */}
          {/* ================================================================ */}
          {activeTab === 'LEMBAR_DATA' && (
            <div className="space-y-6">
              {/* Summary KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#082438] border border-[#1E4E70] rounded-xl p-4">
                  <span className="text-[11px] font-bold text-[#94A3B8] block">
                    TUTUPAN KARANG HIDUP ({selectedMethod})
                  </span>
                  <span className="font-mono-num text-2xl font-extrabold text-[#00E5B8]">
                    {activeStats.sampledCount > 0 ? `${activeStats.hardCoralPct}%` : 'Belum Diambil'}
                  </span>
                  <span className="text-xs text-[#7DD3FC] block mt-1 font-mono-num">
                    Acropora: {activeStats.acroporaPct}% · Non-Acropora: {activeStats.nonAcroporaPct}%
                  </span>
                </div>

                <div className="bg-[#082438] border border-[#1E4E70] rounded-xl p-4">
                  <span className="text-[11px] font-bold text-[#94A3B8] block">
                    KRITERIA KEPMEN LH NO. 4/2001
                  </span>
                  <span
                    className="font-display text-2xl font-extrabold"
                    style={{ color: kepmenStatus.color }}
                  >
                    {kepmenStatus.status}
                  </span>
                  <span className="text-xs text-[#CBD5E1] block mt-1 font-mono-num">
                    Rentang Standar: {kepmenStatus.rangeText}
                  </span>
                </div>

                <div className="bg-[#082438] border border-[#1E4E70] rounded-xl p-4">
                  <span className="text-[11px] font-bold text-[#94A3B8] block">
                    KELIMPAHAN IKAN UVC (250 m²)
                  </span>
                  <span className="font-mono-num text-2xl font-extrabold text-[#38BDF8]">
                    {totalUvcIndividuals} ind
                  </span>
                  <span className="text-xs text-[#CBD5E1] block mt-1 font-mono-num">
                    Setara: {totalUvcIndividuals * 40} ind/ha
                  </span>
                </div>

                <div className="bg-[#082438] border border-[#1E4E70] rounded-xl p-4">
                  <span className="text-[11px] font-bold text-[#94A3B8] block">
                    ESTIMASI BIOMASSA IKAN UVC
                  </span>
                  <span className="font-mono-num text-2xl font-extrabold text-[#FACC15]">
                    {totalUvcBiomassKgHa.toFixed(1)} kg/ha
                  </span>
                  <span className="text-xs text-[#CBD5E1] block mt-1 font-mono-num">
                    Rumus: W = a × TL^b
                  </span>
                </div>
              </div>

              {/* 50-Meter Transect Stations Table */}
              <div className="bg-[#072032] border border-[#163D59] rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[#041522] border-b border-[#163D59] flex items-center justify-between">
                  <h4 className="text-sm font-display font-bold text-[#F0FDFA]">
                    Lembar Kerja Lapangan Pita Transek 50 Meter (Stasiun 5m – 50m)
                  </h4>
                  <span className="text-xs text-[#7DD3FC] font-mono-num">
                    Terdata: {pitStats.sampledCount}/{pitStats.totalStations} Stasiun
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#163D59] text-[#94A3B8] bg-[#051929]">
                        <th className="py-2.5 px-4 font-semibold">Stasiun Meteran</th>
                        <th className="py-2.5 px-4 font-semibold">Kode Lifeform (PIT)</th>
                        <th className="py-2.5 px-4 font-semibold">Kategori Benthic</th>
                        <th className="py-2.5 px-4 font-semibold">Panjang Intersep (LIT)</th>
                        <th className="py-2.5 px-4 font-semibold">Titik Kuadrat 58×44cm (UPT)</th>
                        <th className="py-2.5 px-4 font-semibold">Status Pengambilan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#113148] font-mono-num">
                      {transectStations.map((st) => {
                        const code = st.recordedLifeformCode;
                        const spec = CORAL_LIFEFORMS.find((c) => c.code === (code || st.trueLifeformCode));
                        return (
                          <tr key={st.stationId} className="hover:bg-[#09283F]">
                            <td className="py-2.5 px-4 font-bold text-[#F0FDFA]">
                              Stasiun #{st.stationId} ({st.meterMark}m)
                            </td>
                            <td className="py-2.5 px-4">
                              {code ? (
                                <span className="font-bold text-[#00E5B8]">{code}</span>
                              ) : (
                                <span className="text-[#64748B]">Belum Diambil</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-sans text-[#CBD5E1]">
                              {code && spec ? spec.indonesianName : 'Berenang ke patok meteran & tekan [Spasi]'}
                            </td>
                            <td className="py-2.5 px-4 text-[#7DD3FC]">
                              {code ? `${st.interceptLengthCm} cm / ${st.totalSegmentCm} cm` : '—'}
                            </td>
                            <td className="py-2.5 px-4 text-[#E2F1F8]">
                              {code ? st.uptPointCodes.join(', ') : '—'}
                            </td>
                            <td className="py-2.5 px-4">
                              {code ? (
                                <span className="text-[#00E5B8] font-semibold">Tercatat di Sabak</span>
                              ) : (
                                <span className="text-[#F59E0B]">Menunggu Survei</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: MISSIONS, BADGES & DYNAMIC WEATHER                        */}
          {/* ================================================================ */}
          {activeTab === 'MISI_CUACA' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-display font-bold text-[#F0FDFA] mb-2">
                  Sistem Cuaca Laut Dinamis (Klik untuk Menguji Dampak Visibilitas & Arus pada Survei)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {WEATHER_CYCLE_ORDER.map((wKey) => {
                    const w = WEATHER_CONFIGS[wKey];
                    const isCurrent = currentWeather === wKey;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onTriggerWeatherChange(w.id)}
                        className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#0C3552] border-[#00E5B8]'
                            : 'bg-[#072032] border-[#163D59] hover:border-[#38BDF8]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-display font-bold text-[#F0FDFA]">
                            {w.name}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-semibold text-[#00E5B8]">Aktif</span>
                          )}
                        </div>
                        <div className="text-xs text-[#7DD3FC] mt-1 font-mono-num">
                          Visibilitas: {Math.round(w.visibilityFactor * 100)}% · Arus: {w.currentForceX}px/d
                        </div>
                        <p className="text-xs text-[#CBD5E1] mt-2 leading-snug">
                          {w.gameplayTip}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {missions.map((m, idx) => {
                  const isCurrent = idx === activeMissionIndex;
                  const isCompleted = idx < activeMissionIndex;
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-lg border ${
                        isCurrent
                          ? 'bg-[#092B42] border-[#00E5B8]'
                          : isCompleted
                          ? 'bg-[#062133] border-[#10B981]/60'
                          : 'bg-[#051826] border-[#123149]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-display font-bold text-[#F0FDFA]">
                          {m.title}
                        </h4>
                        <span className="font-mono-num text-xs font-bold text-[#00E5B8] shrink-0">
                          +{m.rewardPoints} PTS
                        </span>
                      </div>
                      <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                        {m.briefing}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs font-mono-num text-[#E2F1F8]">
                        {m.objectives.map((obj) => (
                          <li key={obj.id} className="flex items-center justify-between">
                            <span>- {obj.label}</span>
                            <span className={obj.current >= obj.target ? 'text-[#00E5B8]' : 'text-[#94A3B8]'}>
                              {obj.current}/{obj.target}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div>
                <h3 className="text-base font-display font-bold text-[#F0FDFA] mb-3">
                  Sertifikasi & Penghargaan Peneliti ({unlockedSet.size}/{COLLECTION_BADGES.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {COLLECTION_BADGES.map((badge) => {
                    const unlocked = unlockedSet.has(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`p-3.5 rounded-lg border ${
                          unlocked ? 'bg-[#09293F] border-[#00E5B8]' : 'bg-[#051826] border-[#14354E] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-display font-bold text-[#F0FDFA]">{badge.title}</span>
                          <span className="font-mono-num text-xs text-[#FACC15]">+{badge.bonusScore}</span>
                        </div>
                        <p className="text-xs text-[#CBD5E1] mt-1">{badge.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
