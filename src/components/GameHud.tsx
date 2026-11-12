import React from 'react';
import {
  ToolType,
  SurveyMethodType,
  WeatherType,
  WEATHER_CONFIGS,
  MissionDefinition,
  MARINE_SPECIES,
  classifyKepmenLhStatus,
} from '../game/rules';
import { LogbookTabType } from './LogbookModal';

interface GameHudProps {
  hp: number;
  maxHp: number;
  oxygen: number;
  ghostOxygen: number;
  maxOxygen: number;
  depthMeters: number;
  zoneLabel: string;
  score: number;
  reefHealth: number;
  sampledStationsCount: number;
  totalStationsCount: number;
  discoveredCount: number;
  coralSeedsStock: number;
  activeTool: ToolType;
  selectedMethod: SurveyMethodType;
  onSelectMethodAndTool: (method: SurveyMethodType, tool: ToolType) => void;
  currentWeather: WeatherType;
  weatherTimerSec: number;
  onCycleWeather: () => void;
  activeMission: MissionDefinition;
  activeMissionIndex: number;
  totalMissions: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenLogbook: (tab?: LogbookTabType) => void;
  onTogglePause: () => void;
  onRestart: () => void;
  toastBanner: { title: string; subtitle: string; accent: string } | null;
}

export const GameHud: React.FC<GameHudProps> = ({
  hp,
  maxHp,
  oxygen,
  ghostOxygen,
  maxOxygen,
  depthMeters,
  zoneLabel,
  score,
  reefHealth,
  sampledStationsCount,
  totalStationsCount,
  discoveredCount,
  coralSeedsStock,
  selectedMethod,
  onSelectMethodAndTool,
  currentWeather,
  weatherTimerSec,
  onCycleWeather,
  activeMission,
  activeMissionIndex,
  totalMissions,
  isMuted,
  onToggleMute,
  onOpenLogbook,
  onTogglePause,
  onRestart,
  toastBanner,
}) => {
  const o2Pct = Math.max(0, Math.min(100, (oxygen / maxOxygen) * 100));
  const ghostO2Pct = Math.max(o2Pct, Math.min(100, (ghostOxygen / maxOxygen) * 100));
  const weatherCfg = WEATHER_CONFIGS[currentWeather];
  const kepmen = classifyKepmenLhStatus(reefHealth);

  const methodSlots: {
    method: SurveyMethodType;
    tool: ToolType;
    keyLabel: string;
    name: string;
    roleClue: string;
    stockLabel?: string;
  }[] = [
    {
      method: 'PIT',
      tool: 'CLEANER',
      keyLabel: '1',
      name: 'Transek PIT',
      roleClue: 'Titik Singgung & Bersih Substrat',
    },
    {
      method: 'UVC',
      tool: 'SCANNER',
      keyLabel: '2',
      name: 'Sensus Ikan UVC',
      roleClue: 'Data Indikator, Target & Mayor',
    },
    {
      method: 'LIT',
      tool: 'CORAL_SEED',
      keyLabel: '3',
      name: 'Intersep LIT',
      roleClue: 'Ukur Koloni (cm) & Restorasi',
      stockLabel: `${Math.round(coralSeedsStock)} Bibit`,
    },
    {
      method: 'UPT',
      tool: 'PATROL_CUTTER',
      keyLabel: '4',
      name: 'Kuadrat Foto UPT',
      roleClue: 'Bingkai 58×44cm & Angkat Jaring',
    },
  ];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-5">
      {/* Low-HP / Low-O2 Peripheral Vignette */}
      {(hp <= 1 || o2Pct < 25) && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(239, 68, 68, 0.45)',
          }}
        />
      )}

      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-4">
        {/* TOP-LEFT CLUSTER: Vitality Pips, Oxygen Bar, Depth & Dynamic Weather */}
        <div className="flex flex-col gap-2.5 max-w-xs">
          <div className="bg-[#041624]/90 border border-[#1B4968] rounded-lg px-3.5 py-2.5 shadow-[0_6px_20px_rgba(2,10,18,0.85)]">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-1.5" aria-label={`Ketahanan Penyelam ${hp} dari ${maxHp}`}>
                <span className="text-[11px] font-bold tracking-wider text-[#7DD3FC] mr-1">
                  HP
                </span>
                {Array.from({ length: maxHp }).map((_, i) => {
                  const isFull = i < hp;
                  const isCracked = i === hp && hp < maxHp;
                  return (
                    <svg key={i} viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill={isFull ? '#00E5B8' : isCracked ? '#F59E0B' : '#092234'}
                        stroke="#03101A"
                        strokeWidth="2"
                      />
                    </svg>
                  );
                })}
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold text-[#94A3B8] block leading-none">
                  KEDALAMAN TRANSEK
                </span>
                <span className="font-mono-num text-xs font-bold text-[#F0FDFA] whitespace-nowrap">
                  {Math.round(depthMeters)}m · {zoneLabel}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[11px] font-bold tracking-wider text-[#38BDF8]">
                  OKSIGEN SELAMA SURVEI (O2)
                </span>
                <span className="font-mono-num font-bold text-sm text-[#F0FDFA]">
                  {Math.round(oxygen)} / {Math.round(maxOxygen)}
                </span>
              </div>
              <div className="w-60 h-2.5 bg-[#020D16] rounded overflow-hidden relative border border-[#143750]">
                <div
                  className="absolute inset-0 origin-left bg-[#F59E0B]/70"
                  style={{ transform: `scaleX(${ghostO2Pct / 100})` }}
                />
                <div
                  className={`absolute inset-0 origin-left ${
                    o2Pct < 25 ? 'bg-[#EF4444]' : 'bg-[#00E5B8]'
                  }`}
                  style={{ transform: `scaleX(${o2Pct / 100})` }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Weather & Pre-Dive Guide Quick Button */}
          <div className="bg-[#041624]/90 border border-[#1B4968] rounded-lg px-3.5 py-2 shadow-[0_6px_20px_rgba(2,10,18,0.85)] pointer-events-auto">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-display font-bold text-[#F0FDFA] leading-tight">
                  Cuaca: {weatherCfg.name}
                </div>
                <div className="text-[11px] text-[#7DD3FC] font-mono-num">
                  Visibilitas {Math.round(weatherCfg.visibilityFactor * 100)}% · Ganti {Math.max(1, Math.round(weatherTimerSec))}d
                </div>
              </div>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onCycleWeather();
                }}
                aria-label="Ubah Cuaca Laut"
                className="px-2 py-1 text-[11px] font-semibold bg-[#0C2D45] hover:bg-[#144366] text-[#E2F1F8] rounded border border-[#245980] cursor-pointer whitespace-nowrap shrink-0"
              >
                Cuaca [C]
              </button>
            </div>
          </div>
        </div>

        {/* CENTER NOTIFICATION BANNER */}
        {toastBanner && (
          <div className="hidden md:flex flex-col items-center bg-[#041827]/95 border border-[#00E5B8] px-5 py-2.5 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.85)] max-w-md text-center">
            <span className="text-xs font-display font-bold text-[#00E5B8]">
              {toastBanner.title}
            </span>
            <span className="text-xs text-[#E2F1F8] mt-0.5">
              {toastBanner.subtitle}
            </span>
          </div>
        )}

        {/* TOP-RIGHT CLUSTER: Scientific Reef Cover %, Transect Stations, UVC Count, Utility Controls */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="bg-[#041624]/90 border border-[#1B4968] rounded-lg px-3.5 py-2 flex items-center gap-3.5 shadow-[0_6px_20px_rgba(2,10,18,0.85)]">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] block">
                  TUTUPAN KARANG ({kepmen.status})
                </span>
                <span className="font-mono-num text-lg font-extrabold text-[#00E5B8] leading-tight">
                  {Math.round(reefHealth)}% HC
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#163B56]" />
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] block">
                  STASIUN TRANSEK
                </span>
                <span className="font-mono-num text-lg font-extrabold text-[#FACC15] leading-tight">
                  {sampledStationsCount}/{totalStationsCount}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#163B56]" />
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] block">
                  SENSUS UVC
                </span>
                <span className="font-mono-num text-lg font-extrabold text-[#38BDF8] leading-tight">
                  {discoveredCount}/{MARINE_SPECIES.length}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#163B56]" />
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#94A3B8] block">
                  SKOR RISET
                </span>
                <span className="font-mono-num text-lg font-extrabold text-[#F0FDFA] leading-tight">
                  {Math.round(score)}
                </span>
              </div>
            </div>

            {/* Compact Square SVG Utility Buttons */}
            <button
              type="button"
              tabIndex={-1}
              aria-label="Buka Briefing Metode, Jenis Karang, Ikan UVC, dan Lembar Data"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenLogbook('LEMBAR_DATA');
              }}
              className="px-3 h-10 bg-[#00E5B8] hover:bg-[#14F1C6] text-[#03141F] font-display font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Buka Sabak Data & Panduan Metode [B]"
            >
              <span>Sabak & Metode [B]</span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-10 h-10 bg-[#041624]/90 hover:bg-[#0D314B] border border-[#1B4968] rounded-lg flex items-center justify-center text-[#E2F1F8] cursor-pointer"
              title="Suara [M]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                {isMuted ? (
                  <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                ) : (
                  <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                )}
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Jeda Permainan"
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              className="w-10 h-10 bg-[#041624]/90 hover:bg-[#0D314B] border border-[#1B4968] rounded-lg flex items-center justify-center text-[#E2F1F8] cursor-pointer"
              title="Jeda [P / Esc]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Ulangi Penyelaman"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-10 h-10 bg-[#041624]/90 hover:bg-[#0D314B] border border-[#1B4968] rounded-lg flex items-center justify-center text-[#E2F1F8] cursor-pointer"
              title="Ulangi [R]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>

          {/* Active Conservation & Survey Mission Tracker */}
          <div className="bg-[#041624]/90 border border-[#1B4968] rounded-lg px-3.5 py-2.5 w-76 shadow-[0_6px_20px_rgba(2,10,18,0.85)]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-display font-bold text-[#00E5B8] truncate">
                {activeMission.title}
              </span>
              <span className="font-mono-num text-[11px] text-[#7DD3FC] shrink-0">
                {activeMissionIndex + 1}/{totalMissions}
              </span>
            </div>
            <div className="space-y-1">
              {activeMission.objectives.map((obj) => {
                const done = obj.current >= obj.target;
                return (
                  <div key={obj.id} className="flex items-center justify-between text-xs font-mono-num">
                    <span className={`truncate pr-2 ${done ? 'text-[#00E5B8] line-through' : 'text-[#CBD5E1]'}`}>
                      {obj.label}
                    </span>
                    <span className={`font-bold shrink-0 ${done ? 'text-[#00E5B8]' : 'text-[#F0FDFA]'}`}>
                      {Math.round(obj.current)}/{obj.target}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Perimeter Dock: Scientific Survey Method Selector (PIT, UVC, LIT, UPT) */}
      <div className="flex items-end justify-center pointer-events-auto">
        <div className="bg-[#041624]/95 border border-[#1B4968] rounded-xl p-1.5 flex items-center gap-1.5 shadow-[0_10px_28px_rgba(2,10,18,0.9)]">
          {methodSlots.map((slot) => {
            const isSelected = selectedMethod === slot.method;
            return (
              <button
                key={slot.method}
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectMethodAndTool(slot.method, slot.tool);
                }}
                className={`px-3 py-2 rounded-lg text-left transition-colors cursor-pointer flex items-center gap-2.5 border ${
                  isSelected
                    ? 'bg-[#0C3552] border-[#00E5B8] text-[#F0FDFA]'
                    : 'bg-[#061D2E] border-transparent text-[#94A3B8] hover:text-[#E2F1F8] hover:bg-[#09273D]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono-num text-xs font-bold shrink-0 ${
                    isSelected ? 'bg-[#00E5B8] text-[#03141F]' : 'bg-[#0D2E47] text-[#7DD3FC]'
                  }`}
                >
                  {slot.keyLabel}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-display font-bold leading-tight whitespace-nowrap">
                    {slot.name}
                    {slot.stockLabel && (
                      <span className="ml-1.5 font-mono-num text-[11px] text-[#00E5B8]">
                        ({slot.stockLabel})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#7DD3FC] leading-tight whitespace-nowrap">
                    {slot.roleClue}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
