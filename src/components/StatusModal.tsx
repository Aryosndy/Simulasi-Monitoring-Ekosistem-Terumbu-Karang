import React from 'react';
import { MARINE_SPECIES } from '../game/rules';

export interface RunSnapshot {
  outcome: 'VICTORY' | 'DEFEAT_O2' | 'DEFEAT_HP';
  score: number;
  bestScore: number;
  reefHealth: number;
  discoveredCount: number;
  trashCleaned: number;
  coralsTransplanted: number;
  illegalGearRemoved: number;
  missionsCompleted: number;
}

interface StatusModalProps {
  state: 'paused' | 'gameover';
  snapshot: RunSnapshot | null;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenLogbook: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  state,
  snapshot,
  onResume,
  onRestart,
  onReturnTitle,
  onOpenLogbook,
}) => {
  if (state === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#020B12]/80 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Penyelaman Dijeda"
      >
        <div className="w-full max-w-md bg-[#061C2C] border border-[#1E4968] rounded-xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
          <h2 className="text-2xl font-display font-extrabold text-[#F0FDFA]">
            Ekspedisi Dijeda
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Istirahat sejenak di kedalaman laut Nusantara. Tinjau Buku Catatan Biota atau lanjutkan penyelaman.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 px-4 bg-[#00E5B8] hover:bg-[#14F1C6] text-[#03141F] font-display font-bold text-sm rounded-lg cursor-pointer whitespace-nowrap"
            >
              Lanjutkan Penyelaman [Esc / P]
            </button>
            <button
              type="button"
              onClick={onOpenLogbook}
              className="w-full py-3 px-4 bg-[#0B2B42] hover:bg-[#123C5A] text-[#E2F1F8] border border-[#245980] font-display font-semibold text-sm rounded-lg cursor-pointer whitespace-nowrap"
            >
              Buka Buku Catatan & Misi [B]
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-3 px-4 bg-[#082133] hover:bg-[#0F314B] text-[#CBD5E1] border border-[#19415E] font-display font-semibold text-sm rounded-lg cursor-pointer whitespace-nowrap"
            >
              Ulangi Ekspedisi dari Awal
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#94A3B8] hover:text-[#F0FDFA] cursor-pointer whitespace-nowrap"
            >
              Kembali ke Layar Judul
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;

  const isVictory = snapshot.outcome === 'VICTORY';

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#020B12]/85 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isVictory ? 'Ekspedisi Restorasi Berhasil' : 'Penyelaman Berakhir'}
    >
      <div className="w-full max-w-lg bg-[#061C2C] border border-[#1E4968] rounded-xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
        <div className="text-xs font-bold tracking-wider text-[#00E5B8]">
          {isVictory ? 'RESTORASI EKOSISTEM TUNTAS' : 'LAPORAN DARURAT PENYELAMAN'}
        </div>
        <h2 className="text-2xl font-display font-extrabold text-[#F0FDFA] mt-1">
          {isVictory
            ? 'Penjaga Samudra Nusantara!'
            : snapshot.outcome === 'DEFEAT_O2'
            ? 'Kehabisan Cadangan Oksigen'
            : 'Penyelam Terluka oleh Bahaya Laut'}
        </h2>
        <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
          {isVictory
            ? 'Seluruh rangkaian misi pemulihan terumbu karang, pembersihan jaring ilegal, dan ketahanan badai berhasil diselesaikan!'
            : 'Perhatikan cadangan O2 saat menyelam di Palung Dalam dan waspadai tanda serangan ubur-ubur kotak serta ikan lepu.'}
        </p>

        {/* 3 Tabular Stat Tiles */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="bg-[#041421] border border-[#153954] rounded-lg p-3">
            <span className="text-[10px] font-bold text-[#94A3B8] block">SKOR / TERBAIK</span>
            <span className="font-mono-num text-lg font-extrabold text-[#00E5B8]">
              {Math.round(snapshot.score)}
            </span>
            <span className="font-mono-num text-xs text-[#7DD3FC] block">
              Rekor: {Math.round(snapshot.bestScore)}
            </span>
          </div>

          <div className="bg-[#041421] border border-[#153954] rounded-lg p-3">
            <span className="text-[10px] font-bold text-[#94A3B8] block">KARANG SEHAT</span>
            <span className="font-mono-num text-lg font-extrabold text-[#38BDF8]">
              {Math.round(snapshot.reefHealth)}%
            </span>
            <span className="font-mono-num text-xs text-[#CBD5E1] block">
              {snapshot.coralsTransplanted} Karang Ditanam
            </span>
          </div>

          <div className="bg-[#041421] border border-[#153954] rounded-lg p-3">
            <span className="text-[10px] font-bold text-[#94A3B8] block">BUKU CATATAN</span>
            <span className="font-mono-num text-lg font-extrabold text-[#FACC15]">
              {snapshot.discoveredCount}/{MARINE_SPECIES.length}
            </span>
            <span className="font-mono-num text-xs text-[#CBD5E1] block">
              {snapshot.illegalGearRemoved} Jaring + {snapshot.trashCleaned} Sampah
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="flex-1 py-3 px-5 bg-[#00E5B8] hover:bg-[#14F1C6] text-[#03141F] font-display font-bold text-sm rounded-lg cursor-pointer whitespace-nowrap"
          >
            {isVictory ? 'Mulai Ekspedisi Baru' : 'Coba Lagi [Enter]'}
          </button>
          <button
            type="button"
            onClick={onOpenLogbook}
            className="py-3 px-4 bg-[#0B2B42] hover:bg-[#123C5A] text-[#E2F1F8] border border-[#245980] font-display font-semibold text-sm rounded-lg cursor-pointer whitespace-nowrap"
          >
            Buku Catatan
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="py-3 px-4 bg-[#082133] hover:bg-[#0F314B] text-[#94A3B8] hover:text-[#F0FDFA] rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            Layar Judul
          </button>
        </div>
      </div>
    </div>
  );
};
