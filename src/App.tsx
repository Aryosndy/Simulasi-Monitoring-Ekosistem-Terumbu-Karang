import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MARINE_SPECIES,
  CORAL_LIFEFORMS,
  WEATHER_CONFIGS,
  WEATHER_CYCLE_ORDER,
  MarineSpecies,
  WeatherType,
  ToolType,
  SurveyMethodType,
  MissionDefinition,
  TransectStationRecord,
  UvcFishLogEntry,
  createInitialMissions,
  evaluateSpeciesScan,
  updateMissionProgress,
  calculateReefHealthIndex,
  computeWeatherEffects,
  getSpeciesMigrationWeight,
  calculateFishBiomass,
} from './game/rules';
import { soundEngine } from './game/sound';
import { TitleOverlay } from './components/TitleOverlay';
import { GameHud } from './components/GameHud';
import { LogbookModal, LogbookTabType } from './components/LogbookModal';
import { StatusModal, RunSnapshot } from './components/StatusModal';

type AppGameState = 'title' | 'playing' | 'paused' | 'gameover';

interface CoralSocket {
  id: number;
  meterMark: number;
  x: number;
  y: number;
  state: 'BLEACHED' | 'HEALTHY' | 'SHIELDED';
  lifeformCode: string;
  coralKind: 'ACROPORA' | 'BRAIN' | 'FAN' | 'TABULATE' | 'FOLIOSE' | 'MUSHROOM';
  color: string;
  interceptCm: number;
  uptPoints: string[];
  sampled: boolean;
  hitFlash: number;
}

interface TrashItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: 'BOTTLE' | 'CAN' | 'BAG' | 'TIRE';
  active: boolean;
  bobPhase: number;
}

interface IllegalGear {
  id: number;
  x: number;
  y: number;
  kind: 'GHOST_NET' | 'BUBU_TRAP' | 'ACOUSTIC_LURE';
  hp: number;
  maxHp: number;
  active: boolean;
  hitFlash: number;
  pulsePhase: number;
}

interface FaunaActor {
  uid: number;
  species: MarineSpecies;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  schoolCount: number;
  scannedOnce: boolean;
  swimPhase: number;
  hitFlash: number;
}

interface HazardActor {
  id: number;
  archetype: 'BOX_JELLY' | 'LIONFISH_CHARGER' | 'CROWN_STARFISH';
  name: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  state: 'PATROL' | 'WINDUP' | 'ACTIVE_ATTACK' | 'RECOVERY' | 'REPELLED';
  timer: number;
  aimAngle: number;
  scaleX: number;
  scaleY: number;
  hitFlash: number;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 1350;
const SURFACE_Y = 140;
const PARTICLE_POOL_SIZE = 220;

function createInitialTransectStations(): TransectStationRecord[] {
  const stationDefs: {
    meter: number;
    code: string;
    interceptCm: number;
    upt: string[];
  }[] = [
    { meter: 5, code: 'ACB', interceptCm: 410, upt: ['ACB', 'ACB', 'ACT', 'CM', 'DCA'] },
    { meter: 10, code: 'CM', interceptCm: 380, upt: ['CM', 'CM', 'CM', 'CF', 'DCA'] },
    { meter: 15, code: 'ACT', interceptCm: 440, upt: ['ACT', 'ACT', 'ACB', 'ACT', 'SC'] },
    { meter: 20, code: 'CF', interceptCm: 360, upt: ['CF', 'CF', 'CM', 'CMR', 'DCA'] },
    { meter: 25, code: 'CMR', interceptCm: 310, upt: ['CMR', 'CM', 'CB', 'ACB', 'DCA'] },
    { meter: 30, code: 'CB', interceptCm: 390, upt: ['CB', 'CB', 'ACB', 'CM', 'SC'] },
    { meter: 35, code: 'SC', interceptCm: 290, upt: ['SC', 'SC', 'CF', 'CM', 'DCA'] },
    { meter: 40, code: 'ACT', interceptCm: 450, upt: ['ACT', 'ACT', 'ACT', 'ACB', 'CM'] },
    { meter: 45, code: 'CM', interceptCm: 400, upt: ['CM', 'CM', 'CF', 'ACB', 'DCA'] },
    { meter: 50, code: 'ACB', interceptCm: 420, upt: ['ACB', 'ACB', 'ACT', 'CB', 'CM'] },
  ];

  return stationDefs.map((s, idx) => ({
    stationId: idx + 1,
    meterMark: s.meter,
    trueLifeformCode: s.code,
    recordedLifeformCode: null,
    interceptLengthCm: s.interceptCm,
    totalSegmentCm: 500,
    uptPointCodes: s.upt,
    sampledByMethods: [],
    isClassificationAccurate: true,
  }));
}

export default function App() {
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<AppGameState>(
    initialAutostart ? 'playing' : 'title'
  );
  const [hp, setHp] = useState<number>(3);
  const [maxHp] = useState<number>(3);
  const [oxygen, setOxygen] = useState<number>(100);
  const [ghostOxygen, setGhostOxygen] = useState<number>(100);
  const [maxOxygen, setMaxOxygen] = useState<number>(100);
  const [depthMeters, setDepthMeters] = useState<number>(5);
  const [zoneLabel, setZoneLabel] = useState<string>('Padang Lamun');
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [reefHealth, setReefHealth] = useState<number>(48);
  const [coralSeedsStock, setCoralSeedsStock] = useState<number>(7);
  const [activeTool, setActiveTool] = useState<ToolType>('SCANNER');
  const [selectedMethod, setSelectedMethod] = useState<SurveyMethodType>('PIT');

  const [transectStations, setTransectStations] = useState<TransectStationRecord[]>(
    () => createInitialTransectStations()
  );
  const [uvcLogs, setUvcLogs] = useState<Record<string, UvcFishLogEntry>>({});

  const [discoveredSpeciesIds, setDiscoveredSpeciesIds] = useState<string[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [missions, setMissions] = useState<MissionDefinition[]>(() => createInitialMissions());
  const [activeMissionIndex, setActiveMissionIndex] = useState<number>(0);

  const [currentWeather, setCurrentWeather] = useState<WeatherType>('CERAH');
  const [weatherTimerSec, setWeatherTimerSec] = useState<number>(38);
  const [isLogbookOpen, setIsLogbookOpen] = useState<boolean>(false);
  const [logbookInitialTab, setLogbookInitialTab] = useState<LogbookTabType>('METODE_PRA_SELAM');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);
  const [toastBanner, setToastBanner] = useState<{
    title: string;
    subtitle: string;
    accent: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((title: string, subtitle: string, accent = '#00E5B8') => {
    setToastBanner({ title, subtitle, accent });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastBanner(null);
    }, 4500);
  }, []);

  const openLogbookWithTab = useCallback((tab: LogbookTabType = 'METODE_PRA_SELAM') => {
    setLogbookInitialTab(tab);
    setIsLogbookOpen(true);
  }, []);

  // Mutable simulation state inside ref so 60Hz loop never tears down or re-mounts
  const simRef = useRef({
    state: (initialAutostart ? 'playing' : 'title') as AppGameState,
    isLogbookOpen: false,
    selectedMethod: 'PIT' as SurveyMethodType,
    time: 0,
    hitstop: 0,
    cameraShakeTrauma: 0,
    camX: 180,
    camY: 120,
    viewportW: 1280,
    viewportH: 800,

    // Player Diver
    diver: {
      x: 340,
      y: 260,
      vx: 0,
      vy: 0,
      facing: 1,
      tiltAngle: 0,
      scaleX: 1,
      scaleY: 1,
      swimDistCycle: 0,
      hp: 3,
      maxHp: 3,
      oxygen: 100,
      ghostOxygen: 100,
      maxOxygen: 100,
      invulnTimer: 0,
      hitFlash: 0,
      actionPulseTimer: 0,
      actionPulseRadius: 0,
      actionPulseColor: '#00E5B8',
      coralSeeds: 7,
      activeTool: 'SCANNER' as ToolType,
      swimSpeedMultiplier: 1.0,
      scannerRangeBonus: 0,
      coralShieldBonus: 0,
    },

    // Scores & Counters
    score: 0,
    bestScore: 0,
    reefHealth: 48,
    weatherHealthOffset: 0,
    trashCleanedCount: 0,
    coralsTransplantedCount: 0,
    illegalGearRemovedCount: 0,

    // Scientific Transect & UVC Data
    transectStations: createInitialTransectStations(),
    uvcLogs: {} as Record<string, UvcFishLogEntry>,
    discoveredIds: new Set<string>(),
    unlockedBadges: new Set<string>(),
    missions: createInitialMissions(),
    activeMissionIdx: 0,

    // Dynamic Weather
    weather: 'CERAH' as WeatherType,
    weatherTimer: 38,
    lightningFlash: 0,

    // World Entities
    coralSockets: [] as CoralSocket[],
    trashItems: [] as TrashItem[],
    illegalGears: [] as IllegalGear[],
    faunaList: [] as FaunaActor[],
    hazards: [] as HazardActor[],
    particles: [] as PooledParticle[],

    // Unified Input Hub
    keysHeld: new Set<string>(),
    keysJustPressed: new Set<string>(),
    mouseDown: false,
    mouseJustPressed: false,
    actionBufferTimer: 0,
  });

  useEffect(() => {
    document.body.dataset.state = gameState;
    simRef.current.state = gameState;
  }, [gameState]);

  useEffect(() => {
    simRef.current.isLogbookOpen = isLogbookOpen;
  }, [isLogbookOpen]);

  useEffect(() => {
    simRef.current.selectedMethod = selectedMethod;
  }, [selectedMethod]);

  const spawnParticles = useCallback(
    (x: number, y: number, count: number, color: string, speed = 90, size = 4) => {
      const pool = simRef.current.particles;
      let spawned = 0;
      for (let i = 0; i < pool.length && spawned < count; i++) {
        const p = pool[i];
        if (!p.active) {
          const angle = Math.random() * Math.PI * 2;
          const spd = (0.35 + Math.random() * 0.85) * speed;
          p.active = true;
          p.x = x;
          p.y = y;
          p.vx = Math.cos(angle) * spd;
          p.vy = Math.sin(angle) * spd - 15;
          p.size = size * (0.7 + Math.random() * 0.6);
          p.alpha = 1;
          p.decay = 0.9 + Math.random() * 0.9;
          p.color = color;
          spawned++;
        }
      }
    },
    []
  );

  const initWorldSimulation = useCallback((preserveBestAndLogbook = false) => {
    const sim = simRef.current;

    if (sim.particles.length === 0) {
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        sim.particles.push({
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          size: 3,
          alpha: 0,
          decay: 1,
          color: '#00E5B8',
        });
      }
    } else {
      sim.particles.forEach((p) => {
        p.active = false;
      });
    }

    sim.diver = {
      x: 340,
      y: 260,
      vx: 0,
      vy: 0,
      facing: 1,
      tiltAngle: 0,
      scaleX: 1,
      scaleY: 1,
      swimDistCycle: 0,
      hp: 3,
      maxHp: 3,
      oxygen: 100,
      ghostOxygen: 100,
      maxOxygen: 100,
      invulnTimer: 0,
      hitFlash: 0,
      actionPulseTimer: 0,
      actionPulseRadius: 0,
      actionPulseColor: '#00E5B8',
      coralSeeds: 7,
      activeTool: 'SCANNER',
      swimSpeedMultiplier: 1.0,
      scannerRangeBonus: 0,
      coralShieldBonus: 0,
    };

    sim.score = 0;
    sim.weatherHealthOffset = 0;
    sim.trashCleanedCount = 0;
    sim.coralsTransplantedCount = 0;
    sim.illegalGearRemovedCount = 0;
    sim.weather = 'CERAH';
    sim.weatherTimer = 38;
    sim.lightningFlash = 0;
    sim.hitstop = 0;
    sim.cameraShakeTrauma = 0;

    const freshStations = createInitialTransectStations();
    sim.transectStations = freshStations;
    setTransectStations(freshStations);

    if (!preserveBestAndLogbook) {
      sim.discoveredIds.clear();
      sim.unlockedBadges.clear();
      sim.uvcLogs = {};
      setDiscoveredSpeciesIds([]);
      setUnlockedBadgeIds([]);
      setUvcLogs({});
    }

    const freshMissions = createInitialMissions();
    sim.missions = freshMissions;
    sim.activeMissionIdx = 0;
    setMissions(freshMissions);
    setActiveMissionIndex(0);

    // 10 Scientific Transect Stations along the 50m Reef Contour (5m to 50m marks)
    const coralPositions: {
      meter: number;
      x: number;
      y: number;
      code: string;
      kind: CoralSocket['coralKind'];
      state: CoralSocket['state'];
      color: string;
      interceptCm: number;
      upt: string[];
    }[] = [
      { meter: 5, x: 410, y: 315, code: 'ACB', kind: 'ACROPORA', state: 'BLEACHED', color: '#FF6B4A', interceptCm: 410, upt: ['ACB', 'ACB', 'ACT', 'CM', 'DCA'] },
      { meter: 10, x: 640, y: 650, code: 'CM', kind: 'BRAIN', state: 'HEALTHY', color: '#10B981', interceptCm: 380, upt: ['CM', 'CM', 'CM', 'CF', 'DCA'] },
      { meter: 15, x: 860, y: 710, code: 'ACT', kind: 'TABULATE', state: 'BLEACHED', color: '#F43F5E', interceptCm: 440, upt: ['ACT', 'ACT', 'ACB', 'ACT', 'SC'] },
      { meter: 20, x: 1080, y: 755, code: 'CF', kind: 'FOLIOSE', state: 'BLEACHED', color: '#06B6D4', interceptCm: 360, upt: ['CF', 'CF', 'CM', 'CMR', 'DCA'] },
      { meter: 25, x: 1290, y: 800, code: 'CMR', kind: 'MUSHROOM', state: 'HEALTHY', color: '#A855F7', interceptCm: 310, upt: ['CMR', 'CM', 'CB', 'ACB', 'DCA'] },
      { meter: 30, x: 1490, y: 840, code: 'CB', kind: 'ACROPORA', state: 'BLEACHED', color: '#F59E0B', interceptCm: 390, upt: ['CB', 'CB', 'ACB', 'CM', 'SC'] },
      { meter: 35, x: 1680, y: 890, code: 'SC', kind: 'FAN', state: 'BLEACHED', color: '#EC4899', interceptCm: 290, upt: ['SC', 'SC', 'CF', 'CM', 'DCA'] },
      { meter: 40, x: 1870, y: 950, code: 'ACT', kind: 'TABULATE', state: 'BLEACHED', color: '#F43F5E', interceptCm: 450, upt: ['ACT', 'ACT', 'ACT', 'ACB', 'CM'] },
      { meter: 45, x: 2060, y: 1040, code: 'CM', kind: 'BRAIN', state: 'BLEACHED', color: '#10B981', interceptCm: 400, upt: ['CM', 'CM', 'CF', 'ACB', 'DCA'] },
      { meter: 50, x: 2250, y: 1120, code: 'ACB', kind: 'ACROPORA', state: 'HEALTHY', color: '#FF6B4A', interceptCm: 420, upt: ['ACB', 'ACB', 'ACT', 'CB', 'CM'] },
    ];
    sim.coralSockets = coralPositions.map((c, idx) => ({
      id: idx + 1,
      meterMark: c.meter,
      x: c.x,
      y: c.y,
      state: c.state,
      lifeformCode: c.code,
      coralKind: c.kind,
      color: c.color,
      interceptCm: c.interceptCm,
      uptPoints: c.upt,
      sampled: false,
      hitFlash: 0,
    }));

    const trashCoords = [
      { x: 385, y: 285, kind: 'BOTTLE' as const },
      { x: 620, y: 510, kind: 'BAG' as const },
      { x: 790, y: 420, kind: 'CAN' as const },
      { x: 940, y: 580, kind: 'BOTTLE' as const },
      { x: 1120, y: 470, kind: 'BAG' as const },
      { x: 1290, y: 670, kind: 'TIRE' as const },
      { x: 1510, y: 590, kind: 'CAN' as const },
      { x: 1710, y: 720, kind: 'BOTTLE' as const },
      { x: 1960, y: 780, kind: 'BAG' as const },
      { x: 2220, y: 890, kind: 'TIRE' as const },
    ];
    sim.trashItems = trashCoords.map((t, idx) => ({
      id: idx + 1,
      x: t.x,
      y: t.y,
      vx: 0,
      vy: 0,
      kind: t.kind,
      active: true,
      bobPhase: idx * 0.9,
    }));

    const illegalCoords = [
      { x: 880, y: 520, kind: 'GHOST_NET' as const },
      { x: 1230, y: 630, kind: 'BUBU_TRAP' as const },
      { x: 1460, y: 710, kind: 'GHOST_NET' as const },
      { x: 1690, y: 620, kind: 'ACOUSTIC_LURE' as const },
      { x: 1930, y: 860, kind: 'GHOST_NET' as const },
      { x: 2140, y: 760, kind: 'BUBU_TRAP' as const },
      { x: 2350, y: 960, kind: 'ACOUSTIC_LURE' as const },
    ];
    sim.illegalGears = illegalCoords.map((g, idx) => ({
      id: idx + 1,
      x: g.x,
      y: g.y,
      kind: g.kind,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      pulsePhase: idx * 1.1,
    }));

    // Spawn all 12 Authentic UVC Reef Fish Species
    sim.faunaList = MARINE_SPECIES.map((sp, idx) => {
      let baseX = 450;
      let baseY = 360;
      if (idx === 0) {
        baseX = 365;
        baseY = 275;
      } else if (idx === 1) {
        baseX = 420;
        baseY = 295;
      } else if (sp.zone === 'LAMUN_BAKAU') {
        baseX = 280 + (idx % 4) * 145;
        baseY = 270 + (idx % 3) * 115;
      } else if (sp.zone === 'TERUMBU_INTI') {
        baseX = 950 + (idx % 5) * 175;
        baseY = 400 + (idx % 4) * 110;
      } else {
        baseX = 1920 + (idx % 3) * 200;
        baseY = 520 + (idx % 3) * 170;
      }
      const schoolCount =
        sp.functionalGroup === 'MAYOR'
          ? 12
          : sp.functionalGroup === 'INDIKATOR'
          ? 2
          : 3;
      return {
        uid: idx + 1,
        species: sp,
        x: baseX,
        y: baseY,
        vx: (idx % 2 === 0 ? 1 : -1) * sp.baseSpeed * 0.6,
        vy: 0,
        facing: idx % 2 === 0 ? 1 : -1,
        schoolCount,
        scannedOnce: sim.discoveredIds.has(sp.id),
        swimPhase: idx * 0.7,
        hitFlash: 0,
      };
    });

    sim.hazards = [
      {
        id: 1,
        archetype: 'BOX_JELLY',
        name: 'Ubur-Ubur Kotak',
        x: 740,
        y: 380,
        homeX: 740,
        homeY: 380,
        vx: 0,
        vy: 0,
        state: 'PATROL',
        timer: 1.5,
        aimAngle: Math.PI / 2,
        scaleX: 1,
        scaleY: 1,
        hitFlash: 0,
      },
      {
        id: 2,
        archetype: 'LIONFISH_CHARGER',
        name: 'Ikan Lepu Berbisa',
        x: 1360,
        y: 540,
        homeX: 1360,
        homeY: 540,
        vx: 0,
        vy: 0,
        state: 'PATROL',
        timer: 2.0,
        aimAngle: 0,
        scaleX: 1,
        scaleY: 1,
        hitFlash: 0,
      },
      {
        id: 3,
        archetype: 'CROWN_STARFISH',
        name: 'Bintang Laut Mahkota Duri (Acanthaster)',
        x: 1180,
        y: 760,
        homeX: 1180,
        homeY: 760,
        vx: 0,
        vy: 0,
        state: 'PATROL',
        timer: 2.4,
        aimAngle: 0,
        scaleX: 1,
        scaleY: 1,
        hitFlash: 0,
      },
      {
        id: 4,
        archetype: 'BOX_JELLY',
        name: 'Ubur-Ubur Kotak Laut Dalam',
        x: 1840,
        y: 620,
        homeX: 1840,
        homeY: 620,
        vx: 0,
        vy: 0,
        state: 'PATROL',
        timer: 1.8,
        aimAngle: Math.PI / 2,
        scaleX: 1,
        scaleY: 1,
        hitFlash: 0,
      },
      {
        id: 5,
        archetype: 'LIONFISH_CHARGER',
        name: 'Lepu Karang Dalam',
        x: 2160,
        y: 830,
        homeX: 2160,
        homeY: 830,
        vx: 0,
        vy: 0,
        state: 'PATROL',
        timer: 2.2,
        aimAngle: 0,
        scaleX: 1,
        scaleY: 1,
        hitFlash: 0,
      },
    ];

    const initialHealth = calculateReefHealthIndex({
      restoredCorals: sim.coralSockets.filter((c) => c.state !== 'BLEACHED').length,
      totalCoralSockets: sim.coralSockets.length,
      remainingTrash: sim.trashItems.filter((t) => t.active).length,
      remainingIllegalTraps: sim.illegalGears.filter((g) => g.active).length,
      weatherHealthOffset: 0,
    });
    sim.reefHealth = initialHealth;

    setHp(3);
    setOxygen(100);
    setGhostOxygen(100);
    setMaxOxygen(100);
    setScore(0);
    setReefHealth(initialHealth);
    setCoralSeedsStock(7);
    setCurrentWeather('CERAH');
    setWeatherTimerSec(38);
    setRunSnapshot(null);
  }, []);

  const startGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    simRef.current.keysHeld.clear();
    simRef.current.keysJustPressed.clear();
    simRef.current.mouseDown = false;
    initWorldSimulation(true);
    document.body.dataset.state = 'playing';
    simRef.current.state = 'playing';
    setGameState('playing');
    showToast(
      `Simulasi Survei ${simRef.current.selectedMethod} & UVC Dimulai!`,
      'Ikuti pita transek kuning 50m dan tekan [Spasi] di stasiun karang atau ikan karang untuk mencatat data.'
    );
  }, [initWorldSimulation, showToast]);

  const triggerWeatherChange = useCallback(
    (nextWeather?: WeatherType) => {
      const sim = simRef.current;
      const targetWeather =
        nextWeather ??
        WEATHER_CYCLE_ORDER[
          (WEATHER_CYCLE_ORDER.indexOf(sim.weather) + 1) % WEATHER_CYCLE_ORDER.length
        ];
      sim.weather = targetWeather;
      sim.weatherTimer = 38;
      if (targetWeather === 'BADAI') {
        sim.lightningFlash = 0.85;
      }
      soundEngine.playWeatherShift(targetWeather === 'BADAI');
      setCurrentWeather(targetWeather);
      setWeatherTimerSec(38);
      const cfg = WEATHER_CONFIGS[targetWeather];
      showToast(`Perubahan Cuaca: ${cfg.name}`, cfg.gameplayTip, '#38BDF8');
    },
    [showToast]
  );

  const recordMissionEvent = useCallback(
    (
      type: 'CLEAN_TRASH' | 'TRANSPLANT_CORAL' | 'STOP_ILLEGAL_GEAR' | 'SCAN_SPECIES' | 'REACH_REEF_HEALTH',
      amount?: number,
      absoluteValue?: number
    ) => {
      const sim = simRef.current;
      if (sim.activeMissionIdx >= sim.missions.length) return;

      const currentMission = sim.missions[sim.activeMissionIdx];
      const { updatedMission, isCompleted } = updateMissionProgress(currentMission, {
        type,
        amount,
        absoluteValue,
      });

      const nextMissions = [...sim.missions];
      nextMissions[sim.activeMissionIdx] = updatedMission;
      sim.missions = nextMissions;
      setMissions(nextMissions);

      if (isCompleted) {
        soundEngine.playMissionComplete();
        sim.score += updatedMission.rewardPoints;
        sim.bestScore = Math.max(sim.bestScore, sim.score);
        setScore(sim.score);
        setBestScore(sim.bestScore);

        sim.diver.maxOxygen += updatedMission.upgradeEffect.maxO2Bonus;
        sim.diver.oxygen = sim.diver.maxOxygen;
        sim.diver.ghostOxygen = sim.diver.maxOxygen;
        sim.diver.swimSpeedMultiplier *= updatedMission.upgradeEffect.swimSpeedMultiplier;
        sim.diver.scannerRangeBonus += updatedMission.upgradeEffect.scannerRangeBonus;
        sim.diver.coralShieldBonus = Math.min(
          0.85,
          sim.diver.coralShieldBonus + updatedMission.upgradeEffect.coralShieldBonus
        );
        sim.diver.coralSeeds += 3;

        setMaxOxygen(sim.diver.maxOxygen);
        setOxygen(sim.diver.oxygen);
        setCoralSeedsStock(sim.diver.coralSeeds);

        if (sim.activeMissionIdx + 1 < sim.missions.length) {
          const nextIdx = sim.activeMissionIdx + 1;
          sim.activeMissionIdx = nextIdx;
          setActiveMissionIndex(nextIdx);
          const nextM = sim.missions[nextIdx];
          const syncedScan = updateMissionProgress(nextM, {
            type: 'SCAN_SPECIES',
            absoluteValue: sim.discoveredIds.size,
          });
          const syncedHealth = updateMissionProgress(syncedScan.updatedMission, {
            type: 'REACH_REEF_HEALTH',
            absoluteValue: sim.reefHealth,
          });
          sim.missions[nextIdx] = syncedHealth.updatedMission;
          setMissions([...sim.missions]);

          showToast(
            `${updatedMission.title} Selesai! (+${updatedMission.rewardPoints} PTS)`,
            `Imbalan: ${updatedMission.rewardTitle} (${updatedMission.rewardUpgradeDesc})`,
            '#FACC15'
          );
        } else {
          const snap: RunSnapshot = {
            outcome: 'VICTORY',
            score: sim.score,
            bestScore: sim.bestScore,
            reefHealth: sim.reefHealth,
            discoveredCount: sim.discoveredIds.size,
            trashCleaned: sim.trashCleanedCount,
            coralsTransplanted: sim.coralsTransplantedCount,
            illegalGearRemoved: sim.illegalGearRemovedCount,
            missionsCompleted: sim.missions.length,
          };
          setRunSnapshot(snap);
          sim.state = 'gameover';
          document.body.dataset.state = 'gameover';
          setGameState('gameover');
        }
      }
    },
    [showToast]
  );

  // Execute Diver's Scientific Survey & Restoration Action
  const executeDiverAction = useCallback(() => {
    const sim = simRef.current;
    const d = sim.diver;
    const actionRange = 130 + d.scannerRangeBonus;

    d.actionPulseTimer = 0.32;
    d.actionPulseRadius = actionRange;
    d.scaleX = 1.18;
    d.scaleY = 0.84;

    let actionTaken = false;

    // 1. UVC Visual Census of Reef Fish (Indikator, Target, Mayor)
    for (const fauna of sim.faunaList) {
      const dist = Math.hypot(fauna.x - d.x, fauna.y - d.y);
      if (dist <= actionRange + fauna.species.sizeRadius) {
        const evalRes = evaluateSpeciesScan(
          fauna.species.id,
          sim.discoveredIds,
          sim.unlockedBadges
        );
        fauna.hitFlash = 0.25;
        fauna.scannedOnce = true;
        d.actionPulseColor = '#38BDF8';
        soundEngine.playSpeciesScan(evalRes.isNewDiscovery);
        spawnParticles(fauna.x, fauna.y, evalRes.isNewDiscovery ? 18 : 6, '#38BDF8', 110, 4);

        // Update UVC Abundance & Biomass Log
        const prevLog = sim.uvcLogs[fauna.species.id];
        const nextCount = (prevLog?.countIndividuals ?? 0) + fauna.schoolCount;
        const bioCalc = calculateFishBiomass({
          lwA: fauna.species.lwA,
          lwB: fauna.species.lwB,
          lengthCm: fauna.species.meanLengthCm,
          countIndividuals: nextCount,
        });
        sim.uvcLogs = {
          ...sim.uvcLogs,
          [fauna.species.id]: {
            speciesId: fauna.species.id,
            countIndividuals: nextCount,
            estimatedLengthCm: fauna.species.meanLengthCm,
            totalBiomassGrams: bioCalc.totalWeightGrams,
          },
        };
        setUvcLogs({ ...sim.uvcLogs });

        sim.score += evalRes.totalPointsAwarded;
        sim.bestScore = Math.max(sim.bestScore, sim.score);
        setScore(sim.score);
        setBestScore(sim.bestScore);

        if (evalRes.isNewDiscovery) {
          sim.discoveredIds.add(fauna.species.id);
          evalRes.newlyUnlockedBadges.forEach((b) => sim.unlockedBadges.add(b.id));
          setDiscoveredSpeciesIds(Array.from(sim.discoveredIds));
          setUnlockedBadgeIds(Array.from(sim.unlockedBadges));

          showToast(
            `Sensus UVC [${fauna.species.functionalGroup}]: ${fauna.species.name} (+${evalRes.totalPointsAwarded} PTS)`,
            `Kelimpahan: +${fauna.schoolCount} ind (TL ~${fauna.species.meanLengthCm}cm · Biomassa ${bioCalc.biomassKgPerHa} kg/ha)`,
            '#38BDF8'
          );
          recordMissionEvent('SCAN_SPECIES', undefined, sim.discoveredIds.size);
        } else {
          showToast(
            `Replikasi Sensus UVC: ${fauna.species.name} (+25 PTS)`,
            `Total Tercatat: ${nextCount} ind (${fauna.species.functionalGroupLabel})`
          );
        }
        actionTaken = true;
        break;
      }
    }

    // 2. Sample Coral Transect Station (PIT / LIT / UPT) & Restore Bleached Coral
    for (const socket of sim.coralSockets) {
      const dist = Math.hypot(socket.x - d.x, socket.y - d.y);
      if (dist <= actionRange) {
        if (!socket.sampled || socket.state === 'BLEACHED') {
          socket.sampled = true;
          if (socket.state === 'BLEACHED' && d.coralSeeds > 0) {
            socket.state = d.coralShieldBonus > 0 ? 'SHIELDED' : 'HEALTHY';
            d.coralSeeds -= 1;
            setCoralSeedsStock(d.coralSeeds);
          }
          socket.hitFlash = 0.3;
          sim.coralsTransplantedCount += 1;
          sim.score += 175;
          sim.bestScore = Math.max(sim.bestScore, sim.score);
          sim.hitstop = 0.04;
          d.actionPulseColor = '#00E5B8';
          soundEngine.playCoralTransplant();
          spawnParticles(socket.x, socket.y - 10, 22, '#00E5B8', 120, 5);

          // Record into Scientific Transect Station Log
          const nextStations = sim.transectStations.map((st) => {
            if (st.stationId !== socket.id) return st;
            const methodsSet = new Set(st.sampledByMethods);
            methodsSet.add(sim.selectedMethod);
            return {
              ...st,
              recordedLifeformCode: st.trueLifeformCode,
              sampledByMethods: Array.from(methodsSet),
            };
          });
          sim.transectStations = nextStations;
          setTransectStations(nextStations);

          const spec = CORAL_LIFEFORMS.find((c) => c.code === socket.lifeformCode);
          setScore(sim.score);
          setBestScore(sim.bestScore);
          recordMissionEvent('TRANSPLANT_CORAL', 1);
          showToast(
            `Data ${sim.selectedMethod} Stasiun ${socket.meterMark}m Tercatat: [${socket.lifeformCode}] (+175 PTS)`,
            `${spec?.indonesianName || socket.lifeformCode} · Intersep LIT: ${socket.interceptCm}/500 cm · Kuadrat UPT Terverifikasi`
          );
          actionTaken = true;
          break;
        }
      }
    }

    // 3. Clean Marine Trash along the Transect
    for (const trash of sim.trashItems) {
      if (!trash.active) continue;
      const dist = Math.hypot(trash.x - d.x, trash.y - d.y);
      if (dist <= actionRange) {
        trash.active = false;
        sim.trashCleanedCount += 1;
        sim.score += 95;
        sim.bestScore = Math.max(sim.bestScore, sim.score);
        d.coralSeeds += 1;
        d.actionPulseColor = '#00E5B8';
        soundEngine.playCleanTrash();
        spawnParticles(trash.x, trash.y, 14, '#00E5B8', 95, 4);

        setScore(sim.score);
        setBestScore(sim.bestScore);
        setCoralSeedsStock(d.coralSeeds);
        recordMissionEvent('CLEAN_TRASH', 1);
        showToast(
          'Substrat Transek Dibersihkan! (+95 PTS)',
          'Sampah plastik diangkat dari garis transek sehingga tidak menutupi polip karang.'
        );
        actionTaken = true;
        break;
      }
    }

    // 4. Cut Illegal Fishing Gear / UPT Station Clearance
    for (const gear of sim.illegalGears) {
      if (!gear.active) continue;
      const dist = Math.hypot(gear.x - d.x, gear.y - d.y);
      if (dist <= actionRange + 15) {
        gear.active = false;
        gear.hitFlash = 0.3;
        sim.illegalGearRemovedCount += 1;
        sim.score += 210;
        sim.bestScore = Math.max(sim.bestScore, sim.score);
        sim.hitstop = 0.055;
        sim.cameraShakeTrauma = Math.min(1, sim.cameraShakeTrauma + 0.35);
        d.actionPulseColor = '#FACC15';
        soundEngine.playCutIllegalGear();
        spawnParticles(gear.x, gear.y, 24, '#FACC15', 135, 5);

        setScore(sim.score);
        setBestScore(sim.bestScore);
        recordMissionEvent('STOP_ILLEGAL_GEAR', 1);
        showToast(
          'Kuadrat UPT & Pengamanan Jaring Selesai! (+210 PTS)',
          'Jaring hantu yang mengikis koloni Acropora telah diamankan.'
        );
        actionTaken = true;
        break;
      }
    }

    // 5. Repel nearby aggressive Hazards (Acanthaster / Lionfish / Box Jellyfish)
    for (const haz of sim.hazards) {
      const dist = Math.hypot(haz.x - d.x, haz.y - d.y);
      if (dist <= actionRange + 20) {
        const pushAngle = Math.atan2(haz.y - d.y, haz.x - d.x);
        haz.vx = Math.cos(pushAngle) * 220;
        haz.vy = Math.sin(pushAngle) * 220;
        haz.state = 'REPELLED';
        haz.timer = 1.6;
        haz.hitFlash = 0.25;
        spawnParticles(haz.x, haz.y, 10, '#F59E0B', 90, 3.5);
        actionTaken = true;
      }
    }

    if (!actionTaken) {
      soundEngine.playSwimStroke();
      spawnParticles(d.x + d.facing * 24, d.y, 5, '#7DD3FC', 60, 3);
    }

    const nextHealth = calculateReefHealthIndex({
      restoredCorals: sim.coralSockets.filter((c) => c.state !== 'BLEACHED').length,
      totalCoralSockets: sim.coralSockets.length,
      remainingTrash: sim.trashItems.filter((t) => t.active).length,
      remainingIllegalTraps: sim.illegalGears.filter((g) => g.active).length,
      weatherHealthOffset: sim.weatherHealthOffset,
    });
    sim.reefHealth = nextHealth;
    setReefHealth(nextHealth);
    recordMissionEvent('REACH_REEF_HEALTH', undefined, nextHealth);
  }, [recordMissionEvent, showToast, spawnParticles]);

  // Mount Canvas & 60fps Game Loop once
  useEffect(() => {
    initWorldSimulation(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      simRef.current.viewportW = rect.width;
      simRef.current.viewportH = rect.height;
    };

    updateCanvasSize();
    const resizeObs = new ResizeObserver(updateCanvasSize);
    resizeObs.observe(canvas);

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const sim = simRef.current;

      if (code === 'KeyM') {
        soundEngine.muted = !soundEngine.muted;
        setIsMuted(soundEngine.muted);
        return;
      }

      if (sim.state === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (sim.state === 'gameover') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (code === 'KeyB' || code === 'KeyE') {
        e.preventDefault();
        setIsLogbookOpen((prev) => !prev);
        return;
      }

      if (code === 'Escape' || code === 'KeyP') {
        e.preventDefault();
        if (sim.isLogbookOpen) {
          setIsLogbookOpen(false);
          return;
        }
        if (sim.state === 'playing') {
          sim.state = 'paused';
          document.body.dataset.state = 'paused';
          setGameState('paused');
        } else if (sim.state === 'paused') {
          sim.state = 'playing';
          document.body.dataset.state = 'playing';
          setGameState('playing');
        }
        return;
      }

      if (sim.state !== 'playing' || sim.isLogbookOpen) return;

      if (code === 'Digit1') {
        sim.selectedMethod = 'PIT';
        sim.diver.activeTool = 'CLEANER';
        setSelectedMethod('PIT');
        setActiveTool('CLEANER');
      } else if (code === 'Digit2') {
        sim.selectedMethod = 'UVC';
        sim.diver.activeTool = 'SCANNER';
        setSelectedMethod('UVC');
        setActiveTool('SCANNER');
      } else if (code === 'Digit3') {
        sim.selectedMethod = 'LIT';
        sim.diver.activeTool = 'CORAL_SEED';
        setSelectedMethod('LIT');
        setActiveTool('CORAL_SEED');
      } else if (code === 'Digit4') {
        sim.selectedMethod = 'UPT';
        sim.diver.activeTool = 'PATROL_CUTTER';
        setSelectedMethod('UPT');
        setActiveTool('PATROL_CUTTER');
      } else if (code === 'KeyC') {
        triggerWeatherChange();
      } else if (code === 'KeyR') {
        startGame();
      }

      if (!sim.keysHeld.has(code)) {
        sim.keysJustPressed.add(code);
        if (code === 'Space' || e.key === ' ' || code === 'KeyF') {
          e.preventDefault();
          executeDiverAction();
        }
      }
      sim.keysHeld.add(code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      simRef.current.keysHeld.delete(e.code);
    };

    const clearInputsOnBlur = () => {
      simRef.current.keysHeld.clear();
      simRef.current.keysJustPressed.clear();
      simRef.current.mouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearInputsOnBlur);

    let lastTime = performance.now();
    let rafId = 0;
    let frameTimerId = 0;
    let hudSyncAccum = 0;

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      const sim = simRef.current;

      sim.time += dt;
      sim.cameraShakeTrauma = Math.max(0, sim.cameraShakeTrauma - dt * 1.4);
      sim.lightningFlash = Math.max(0, sim.lightningFlash - dt * 2.2);

      if (sim.state === 'title') {
        const panX = 480 + Math.sin(sim.time * 0.22) * 380;
        const panY = 260 + Math.cos(sim.time * 0.18) * 90;
        sim.camX += (panX - sim.camX) * Math.min(1, dt * 3);
        sim.camY += (panY - sim.camY) * Math.min(1, dt * 3);
      }

      if (sim.state === 'playing' && !sim.isLogbookOpen) {
        if (sim.hitstop > 0) {
          sim.hitstop = Math.max(0, sim.hitstop - dt);
        } else {
          const simDt = dt;
          const d = sim.diver;

          sim.weatherTimer -= simDt;
          if (sim.weatherTimer <= 0) {
            const nextW =
              WEATHER_CYCLE_ORDER[
                (WEATHER_CYCLE_ORDER.indexOf(sim.weather) + 1) % WEATHER_CYCLE_ORDER.length
              ];
            triggerWeatherChange(nextW);
          }

          if (sim.weather === 'BADAI' && Math.random() < simDt * 0.22) {
            sim.lightningFlash = 0.75;
          }

          const weatherFx = computeWeatherEffects(sim.weather, d.coralShieldBonus);

          sim.weatherHealthOffset = Math.max(
            -14,
            Math.min(10, sim.weatherHealthOffset + weatherFx.effectiveCoralHealthRate * simDt * 0.35)
          );

          let moveX = 0;
          let moveY = 0;
          if (sim.keysHeld.has('KeyA') || sim.keysHeld.has('ArrowLeft')) moveX -= 1;
          if (sim.keysHeld.has('KeyD') || sim.keysHeld.has('ArrowRight')) moveX += 1;
          if (sim.keysHeld.has('KeyW') || sim.keysHeld.has('ArrowUp')) moveY -= 1;
          if (sim.keysHeld.has('KeyS') || sim.keysHeld.has('ArrowDown')) moveY += 1;

          const isBoosting =
            (sim.keysHeld.has('ShiftLeft') || sim.keysHeld.has('ShiftRight')) && d.oxygen > 12;
          const baseAccel = 680 * d.swimSpeedMultiplier * (isBoosting ? 1.42 : 1.0);

          if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            moveX /= len;
            moveY /= len;
            d.vx += moveX * baseAccel * simDt;
            d.vy += moveY * baseAccel * simDt;
            if (Math.abs(moveX) > 0.1) {
              d.facing = moveX > 0 ? 1 : -1;
            }
          }

          const depthFactor = Math.max(0.25, 1 - (d.y - SURFACE_Y) / 1100);
          d.vx += weatherFx.currentDriftX * depthFactor * simDt * 1.4;
          d.vy += weatherFx.currentDriftY * depthFactor * simDt * 1.1;

          const drag = Math.pow(0.06, simDt);
          d.vx *= drag;
          d.vy *= drag;

          d.x += d.vx * simDt;
          d.y += d.vy * simDt;

          d.x = Math.max(60, Math.min(WORLD_WIDTH - 60, d.x));
          d.y = Math.max(SURFACE_Y - 8, Math.min(WORLD_HEIGHT - 70, d.y));

          const speed = Math.hypot(d.vx, d.vy);
          d.swimDistCycle += speed * simDt * 0.055;
          d.tiltAngle = Math.atan2(d.vy, Math.abs(d.vx) + 120) * 0.45 * d.facing;
          d.scaleX += (1 - d.scaleX) * Math.min(1, simDt * 12);
          d.scaleY += (1 - d.scaleY) * Math.min(1, simDt * 12);
          d.invulnTimer = Math.max(0, d.invulnTimer - simDt);
          d.hitFlash = Math.max(0, d.hitFlash - simDt);
          d.actionPulseTimer = Math.max(0, d.actionPulseTimer - simDt);

          if (sim.actionBufferTimer > 0) {
            sim.actionBufferTimer = 0;
            executeDiverAction();
          }

          const depthMetersCalc = Math.max(0, (d.y - SURFACE_Y) / 28);
          const nearSurface = d.y <= SURFACE_Y + 42;
          const nearOxygenStation = Math.hypot(d.x - 480, d.y - (SURFACE_Y + 30)) < 110;
          const nearBubbleVent =
            Math.hypot(d.x - 1560, d.y - 840) < 85 || Math.hypot(d.x - 2120, d.y - 1090) < 95;

          if (nearSurface || nearOxygenStation || nearBubbleVent) {
            d.oxygen = Math.min(d.maxOxygen, d.oxygen + 36 * simDt);
          } else {
            const depthDrain = 1.45 + depthMetersCalc * 0.045 + (isBoosting ? 1.6 : 0);
            d.oxygen = Math.max(0, d.oxygen - depthDrain * simDt);
          }
          if (d.ghostOxygen > d.oxygen) {
            d.ghostOxygen = Math.max(d.oxygen, d.ghostOxygen - 14 * simDt);
          } else {
            d.ghostOxygen = d.oxygen;
          }

          if (d.oxygen <= 0) {
            soundEngine.playHurt();
            const snap: RunSnapshot = {
              outcome: 'DEFEAT_O2',
              score: sim.score,
              bestScore: sim.bestScore,
              reefHealth: sim.reefHealth,
              discoveredCount: sim.discoveredIds.size,
              trashCleaned: sim.trashCleanedCount,
              coralsTransplanted: sim.coralsTransplantedCount,
              illegalGearRemoved: sim.illegalGearRemovedCount,
              missionsCompleted: sim.activeMissionIdx,
            };
            setRunSnapshot(snap);
            sim.state = 'gameover';
            document.body.dataset.state = 'gameover';
            setGameState('gameover');
          }

          const targetCamX = Math.max(
            0,
            Math.min(WORLD_WIDTH - sim.viewportW, d.x - sim.viewportW * 0.5)
          );
          const targetCamY = Math.max(
            0,
            Math.min(WORLD_HEIGHT - sim.viewportH, d.y - sim.viewportH * 0.5)
          );
          sim.camX += (targetCamX - sim.camX) * Math.min(1, simDt * 7.5);
          sim.camY += (targetCamY - sim.camY) * Math.min(1, simDt * 7.5);

          for (const fauna of sim.faunaList) {
            const migWeight = getSpeciesMigrationWeight(fauna.species, sim.weather);
            fauna.swimPhase += simDt * (2.2 + migWeight * 0.8);
            fauna.hitFlash = Math.max(0, fauna.hitFlash - simDt);

            const spdMult = migWeight > 1.2 ? 1.25 : 0.85;
            fauna.x += fauna.vx * spdMult * simDt;
            fauna.y += Math.sin(fauna.swimPhase) * 16 * simDt;

            let minX = 120;
            let maxX = 860;
            if (fauna.species.zone === 'TERUMBU_INTI') {
              minX = 820;
              maxX = 1860;
            } else if (fauna.species.zone === 'PALUNG_DALAM') {
              minX = 1780;
              maxX = WORLD_WIDTH - 100;
            }
            if (
              (sim.weather === 'UPWELLING' || sim.weather === 'BADAI') &&
              fauna.species.rarity === 'ENDEMIK_DILINDUNGI'
            ) {
              minX = Math.max(250, minX - 450);
            }

            if (fauna.x < minX) {
              fauna.x = minX;
              fauna.vx = Math.abs(fauna.vx);
              fauna.facing = 1;
            } else if (fauna.x > maxX) {
              fauna.x = maxX;
              fauna.vx = -Math.abs(fauna.vx);
              fauna.facing = -1;
            }
          }

          let activeAttackers = sim.hazards.filter(
            (h) => h.state === 'WINDUP' || h.state === 'ACTIVE_ATTACK'
          ).length;

          for (const haz of sim.hazards) {
            haz.hitFlash = Math.max(0, haz.hitFlash - simDt);
            haz.scaleX += (1 - haz.scaleX) * Math.min(1, simDt * 8);
            haz.scaleY += (1 - haz.scaleY) * Math.min(1, simDt * 8);

            const distToDiver = Math.hypot(d.x - haz.x, d.y - haz.y);

            if (haz.state === 'REPELLED') {
              haz.x += haz.vx * simDt;
              haz.y += haz.vy * simDt;
              haz.vx *= Math.pow(0.1, simDt);
              haz.vy *= Math.pow(0.1, simDt);
              haz.timer -= simDt;
              if (haz.timer <= 0) {
                haz.state = 'PATROL';
                haz.timer = 1.5;
              }
              continue;
            }

            if (haz.archetype === 'BOX_JELLY') {
              if (haz.state === 'PATROL') {
                haz.x = haz.homeX + Math.sin(sim.time * 1.1 + haz.id) * 65;
                haz.y = haz.homeY + Math.cos(sim.time * 1.5 + haz.id) * 45;
                if (distToDiver < 175 && activeAttackers < 2) {
                  haz.state = 'WINDUP';
                  haz.timer = 0.55;
                  haz.aimAngle = Math.atan2(d.y - haz.y, d.x - haz.x);
                  haz.scaleX = 1.25;
                  haz.scaleY = 0.78;
                  activeAttackers++;
                  soundEngine.playTelegraphWarning();
                }
              } else if (haz.state === 'WINDUP') {
                haz.timer -= simDt;
                if (haz.timer <= 0) {
                  haz.state = 'ACTIVE_ATTACK';
                  haz.timer = 0.45;
                  haz.vx = Math.cos(haz.aimAngle) * 240;
                  haz.vy = Math.sin(haz.aimAngle) * 240;
                  haz.scaleX = 0.82;
                  haz.scaleY = 1.24;
                }
              } else if (haz.state === 'ACTIVE_ATTACK') {
                haz.x += haz.vx * simDt;
                haz.y += haz.vy * simDt;
                haz.timer -= simDt;
                if (haz.timer <= 0) {
                  haz.state = 'RECOVERY';
                  haz.timer = 1.2;
                }
              } else if (haz.state === 'RECOVERY') {
                haz.x += (haz.homeX - haz.x) * simDt * 2;
                haz.y += (haz.homeY - haz.y) * simDt * 2;
                haz.timer -= simDt;
                if (haz.timer <= 0) haz.state = 'PATROL';
              }
            } else if (haz.archetype === 'LIONFISH_CHARGER') {
              if (haz.state === 'PATROL') {
                haz.x = haz.homeX + Math.cos(sim.time * 0.9 + haz.id) * 90;
                haz.y = haz.homeY + Math.sin(sim.time * 1.8 + haz.id) * 25;
                if (distToDiver < 210 && activeAttackers < 2) {
                  haz.state = 'WINDUP';
                  haz.timer = 0.6;
                  haz.aimAngle = Math.atan2(d.y - haz.y, d.x - haz.x);
                  haz.scaleX = 0.8;
                  haz.scaleY = 1.2;
                  activeAttackers++;
                  soundEngine.playTelegraphWarning();
                }
              } else if (haz.state === 'WINDUP') {
                haz.aimAngle = Math.atan2(d.y - haz.y, d.x - haz.x);
                haz.timer -= simDt;
                if (haz.timer <= 0) {
                  haz.state = 'ACTIVE_ATTACK';
                  haz.timer = 0.4;
                  haz.vx = Math.cos(haz.aimAngle) * 310;
                  haz.vy = Math.sin(haz.aimAngle) * 310;
                  haz.scaleX = 1.28;
                  haz.scaleY = 0.78;
                }
              } else if (haz.state === 'ACTIVE_ATTACK') {
                haz.x += haz.vx * simDt;
                haz.y += haz.vy * simDt;
                haz.timer -= simDt;
                if (haz.timer <= 0) {
                  haz.state = 'RECOVERY';
                  haz.timer = 1.4;
                }
              } else if (haz.state === 'RECOVERY') {
                haz.x += (haz.homeX - haz.x) * simDt * 2.2;
                haz.y += (haz.homeY - haz.y) * simDt * 2.2;
                haz.timer -= simDt;
                if (haz.timer <= 0) haz.state = 'PATROL';
              }
            } else if (haz.archetype === 'CROWN_STARFISH') {
              if (haz.state === 'PATROL') {
                haz.x = haz.homeX + Math.sin(sim.time * 0.5) * 70;
                if (distToDiver < 140 && activeAttackers < 2) {
                  haz.state = 'WINDUP';
                  haz.timer = 0.65;
                  activeAttackers++;
                  soundEngine.playTelegraphWarning();
                }
              } else if (haz.state === 'WINDUP') {
                haz.timer -= simDt;
                if (haz.timer <= 0) {
                  haz.state = 'ACTIVE_ATTACK';
                  haz.timer = 0.5;
                  haz.scaleX = 1.35;
                  haz.scaleY = 1.35;
                }
              } else if (haz.state === 'ACTIVE_ATTACK') {
                haz.timer -= simDt;
                if (haz.timer <= 0) {
                  haz.state = 'RECOVERY';
                  haz.timer = 1.5;
                }
              } else if (haz.state === 'RECOVERY') {
                haz.timer -= simDt;
                if (haz.timer <= 0) haz.state = 'PATROL';
              }
            }

            const hitRadius = haz.state === 'ACTIVE_ATTACK' ? 36 : 22;
            if (distToDiver < hitRadius && d.invulnTimer <= 0 && haz.state !== 'WINDUP') {
              d.hp = Math.max(0, d.hp - 1);
              d.invulnTimer = 1.5;
              d.hitFlash = 0.35;
              sim.hitstop = 0.065;
              sim.cameraShakeTrauma = 0.65;
              const knockAngle = Math.atan2(d.y - haz.y, d.x - haz.x);
              d.vx = Math.cos(knockAngle) * 280;
              d.vy = Math.sin(knockAngle) * 280;
              soundEngine.playHurt();
              spawnParticles(d.x, d.y, 20, '#EF4444', 130, 4.5);
              setHp(d.hp);

              if (d.hp <= 0) {
                const snap: RunSnapshot = {
                  outcome: 'DEFEAT_HP',
                  score: sim.score,
                  bestScore: sim.bestScore,
                  reefHealth: sim.reefHealth,
                  discoveredCount: sim.discoveredIds.size,
                  trashCleaned: sim.trashCleanedCount,
                  coralsTransplanted: sim.coralsTransplantedCount,
                  illegalGearRemoved: sim.illegalGearRemovedCount,
                  missionsCompleted: sim.activeMissionIdx,
                };
                setRunSnapshot(snap);
                sim.state = 'gameover';
                document.body.dataset.state = 'gameover';
                setGameState('gameover');
              }
            }
          }

          hudSyncAccum += simDt;
          if (hudSyncAccum >= 0.1) {
            hudSyncAccum = 0;
            const dMeters = Math.max(1, Math.round((d.y - SURFACE_Y) / 28));
            setDepthMeters(dMeters);
            setOxygen(d.oxygen);
            setGhostOxygen(d.ghostOxygen);
            setWeatherTimerSec(sim.weatherTimer);
            const zName =
              d.x < 850
                ? 'Padang Lamun'
                : d.x < 1850
                ? 'Terumbu Inti'
                : 'Palung Dalam';
            setZoneLabel(zName);
          }
        }
      }

      // Ambient particles
      if (Math.random() < dt * 16) {
        spawnParticles(
          sim.camX + Math.random() * sim.viewportW,
          sim.camY + sim.viewportH - 10,
          1,
          'rgba(125, 211, 252, 0.55)',
          30,
          2.5
        );
      }
      for (let i = 0; i < sim.particles.length; i++) {
        const p = sim.particles[i];
        if (!p.active) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= p.decay * dt;
        if (p.alpha <= 0) {
          p.active = false;
        }
      }

      // ========================================================================
      // RENDER SCIENTIFIC REEF TRANSECT & UVC ECOSYSTEM WORLD
      // ========================================================================
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.scale(dpr, dpr);

      const vw = sim.viewportW;
      const vh = sim.viewportH;

      const shakeMag = sim.cameraShakeTrauma * sim.cameraShakeTrauma * 14;
      const shakeX = (Math.random() * 2 - 1) * shakeMag;
      const shakeY = (Math.random() * 2 - 1) * shakeMag;

      const oceanGrad = ctx.createLinearGradient(0, -sim.camY, 0, WORLD_HEIGHT - sim.camY);
      if (sim.weather === 'BADAI') {
        oceanGrad.addColorStop(0, '#0F172A');
        oceanGrad.addColorStop(0.12, '#082F49');
        oceanGrad.addColorStop(0.55, '#041E30');
        oceanGrad.addColorStop(1, '#020B13');
      } else if (sim.weather === 'UPWELLING') {
        oceanGrad.addColorStop(0, '#0E7490');
        oceanGrad.addColorStop(0.12, '#065F46');
        oceanGrad.addColorStop(0.55, '#062C43');
        oceanGrad.addColorStop(1, '#03121E');
      } else {
        oceanGrad.addColorStop(0, '#38BDF8');
        oceanGrad.addColorStop(0.11, '#0284C7');
        oceanGrad.addColorStop(0.5, '#052E47');
        oceanGrad.addColorStop(1, '#02101B');
      }
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, vw, vh);

      ctx.save();
      ctx.translate(-sim.camX + shakeX, -sim.camY + shakeY);

      // 1. Sunbeams / Caustics
      if (sim.weather !== 'BADAI') {
        ctx.save();
        const beamAlpha = sim.weather === 'CERAH' ? 0.09 : 0.045;
        ctx.fillStyle = `rgba(186, 230, 253, ${beamAlpha})`;
        for (let b = 0; b < 9; b++) {
          const bx = 180 + b * 290 + Math.sin(sim.time * 0.4 + b) * 35;
          ctx.beginPath();
          ctx.moveTo(bx, SURFACE_Y);
          ctx.lineTo(bx + 90, SURFACE_Y);
          ctx.lineTo(bx + 240, SURFACE_Y + 750);
          ctx.lineTo(bx + 40, SURFACE_Y + 750);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Ocean Surface Wave Line
      const waveAmp = 5 + WEATHER_CONFIGS[sim.weather].stormWaveIntensity * 14;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let wx = 0; wx <= WORLD_WIDTH; wx += 40) {
        const wy =
          SURFACE_Y +
          Math.sin(wx * 0.018 + sim.time * 2.6) * waveAmp +
          Math.cos(wx * 0.035 - sim.time * 1.9) * (waveAmp * 0.4);
        ctx.lineTo(wx, wy);
      }
      ctx.lineTo(WORLD_WIDTH, 0);
      ctx.closePath();
      ctx.fillStyle = sim.weather === 'BADAI' ? '#1E293B' : '#7DD3FC';
      ctx.fill();

      // Surface Rain
      if (sim.weather === 'HUJAN' || sim.weather === 'BADAI') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 45; r++) {
          const rx = ((r * 73 + sim.time * 320) % vw) + sim.camX;
          const ry = (r * 37 + sim.time * 480) % (SURFACE_Y + 70);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 6, ry + 16);
          ctx.stroke();
        }
      }

      // Oxygen Buoy at X: 480
      ctx.save();
      const buoyY = SURFACE_Y + Math.sin(sim.time * 2.4) * 5;
      ctx.fillStyle = '#00E5B8';
      ctx.strokeStyle = '#03101A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(452, buoyY - 22, 56, 32, 6);
      ctx.fill();
      ctx.stroke();
      if (sim.state !== 'title') {
        ctx.fillStyle = '#03141F';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('POS O2', 480, buoyY - 2);
      }
      ctx.restore();

      // 3. Multi-Zone Seabed & Reef Architecture
      ctx.beginPath();
      ctx.moveTo(0, WORLD_HEIGHT);
      ctx.lineTo(0, 620);
      ctx.quadraticCurveTo(420, 650, 850, 740);
      ctx.quadraticCurveTo(1350, 830, 1850, 960);
      ctx.quadraticCurveTo(2200, 1120, WORLD_WIDTH, 1220);
      ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
      ctx.closePath();
      ctx.fillStyle = '#072235';
      ctx.fill();
      ctx.strokeStyle = '#164E63';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Mangrove Roots & Seagrass Meadow in Zone 1
      ctx.save();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 6;
      for (let m = 0; m < 5; m++) {
        const mx = 70 + m * 42;
        ctx.beginPath();
        ctx.moveTo(mx, SURFACE_Y + 10);
        ctx.quadraticCurveTo(mx + 25, 390, mx - 10 + m * 8, 635);
        ctx.stroke();
      }
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3.5;
      for (let sg = 140; sg < 820; sg += 28) {
        const baseY = 630 + ((sg - 140) / 680) * 105;
        const sway = Math.sin(sim.time * 2.1 + sg * 0.05) * 14;
        ctx.beginPath();
        ctx.moveTo(sg, baseY);
        ctx.quadraticCurveTo(sg + sway * 0.5, baseY - 35, sg + sway, baseY - 68);
        ctx.stroke();
      }
      ctx.restore();

      // 3B. SCIENTIFIC 50-METER FIBERGLASS TRANSECT TAPE & UVC BELT CORRIDOR
      if (sim.coralSockets.length > 1) {
        ctx.save();
        // UVC 5m Belt Corridor Upper Bound Line (dashed cyan)
        ctx.beginPath();
        sim.coralSockets.forEach((st, idx) => {
          if (idx === 0) ctx.moveTo(st.x, st.y - 110);
          else ctx.lineTo(st.x, st.y - 110);
        });
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.stroke();

        // Main Yellow Fiberglass Roll-Tape Line connecting all 10 Transect Stations
        ctx.beginPath();
        sim.coralSockets.forEach((st, idx) => {
          if (idx === 0) ctx.moveTo(st.x, st.y - 6);
          else ctx.lineTo(st.x, st.y - 6);
        });
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 4. Render 10 Interactive Coral Transect Stations (ACB, ACT, CM, CF, CMR, CB, SC)
      for (const socket of sim.coralSockets) {
        ctx.save();
        ctx.translate(socket.x, socket.y);
        const isBleached = socket.state === 'BLEACHED' && !socket.sampled;
        const coralColor =
          socket.hitFlash > 0 ? '#FFFFFF' : isBleached ? '#CBD5E1' : socket.color;

        if (socket.state === 'SHIELDED') {
          ctx.beginPath();
          ctx.arc(0, -22, 42, Math.PI, 0);
          ctx.strokeStyle = 'rgba(0, 229, 184, 0.55)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw Authentic Coral Lifeform Structure
        ctx.fillStyle = coralColor;
        ctx.strokeStyle = '#03101A';
        ctx.lineWidth = 2;
        if (socket.coralKind === 'ACROPORA') {
          for (let b = -2; b <= 2; b++) {
            const angle = b * 0.32 + Math.sin(sim.time * 1.5 + socket.id) * 0.04;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.roundRect(-5, -46, 10, 46, 5);
            ctx.fill();
            ctx.stroke();
            // Axial corallite tip
            ctx.fillStyle = '#FEF08A';
            ctx.beginPath();
            ctx.arc(0, -44, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else if (socket.coralKind === 'TABULATE') {
          ctx.beginPath();
          ctx.roundRect(-8, -24, 16, 24, 3);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, -26, 34, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (socket.coralKind === 'BRAIN') {
          ctx.beginPath();
          ctx.arc(0, -16, 26, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (socket.coralKind === 'FOLIOSE') {
          ctx.beginPath();
          ctx.ellipse(-10, -20, 18, 11, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(10, -22, 18, 11, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (socket.coralKind === 'MUSHROOM') {
          ctx.beginPath();
          ctx.ellipse(0, -14, 24, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.ellipse(0, -28, 28, 22, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Transect Meter Stake Marker
        if (sim.state !== 'title') {
          ctx.fillStyle = socket.sampled ? '#00E5B8' : '#FACC15';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${socket.meterMark}m [${socket.lifeformCode}]`,
            0,
            18
          );

          const distToDiver = Math.hypot(sim.diver.x - socket.x, sim.diver.y - socket.y);
          if (distToDiver < 150) {
            // Draw UPT 58x44cm Quadrat Frame or PIT/LIT indicator
            ctx.strokeStyle = '#00E5B8';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(-32, -52, 64, 48);

            ctx.fillStyle = '#00E5B8';
            ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(
              socket.sampled
                ? `Terdata: ${socket.lifeformCode} (${socket.interceptCm}cm)`
                : `[Spasi] Ambil Data ${sim.selectedMethod}: ${socket.lifeformCode}`,
              0,
              -62
            );
          }
        }
        ctx.restore();
      }

      // 5. Render Marine Trash Items
      for (const trash of sim.trashItems) {
        if (!trash.active) continue;
        const bobY = trash.y + Math.sin(sim.time * 2 + trash.bobPhase) * 6;
        ctx.save();
        ctx.translate(trash.x, bobY);
        ctx.fillStyle = trash.kind === 'BAG' ? '#E2E8F0' : trash.kind === 'TIRE' ? '#334155' : '#F97316';
        ctx.strokeStyle = '#03101A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (trash.kind === 'TIRE') {
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
        } else {
          ctx.roundRect(-11, -14, 22, 28, 4);
        }
        ctx.fill();
        ctx.stroke();

        if (sim.state !== 'title') {
          const dist = Math.hypot(sim.diver.x - trash.x, sim.diver.y - bobY);
          if (dist < 140) {
            ctx.fillStyle = '#00E5B8';
            ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('[Spasi] Bersihkan Substrat', 0, -24);
          }
        }
        ctx.restore();
      }

      // 6. Render Illegal Fishing Gear / UPT Quadrat Obstructions
      for (const gear of sim.illegalGears) {
        if (!gear.active) continue;
        ctx.save();
        ctx.translate(gear.x, gear.y);
        gear.pulsePhase += dt * 3;

        ctx.beginPath();
        ctx.arc(0, 0, 32 + Math.sin(gear.pulsePhase) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#78350F';
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-22, -18, 44, 36, 4);
        ctx.fill();
        ctx.stroke();

        if (sim.state !== 'title') {
          ctx.fillStyle = '#FACC15';
          ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          const label =
            gear.kind === 'GHOST_NET'
              ? 'Jaring Hantu di Transek'
              : gear.kind === 'BUBU_TRAP'
              ? 'Bubu Ilegal'
              : 'Suar Pukat Ilegal';
          ctx.fillText(label, 0, 32);

          const dist = Math.hypot(sim.diver.x - gear.x, sim.diver.y - gear.y);
          if (dist < 150) {
            ctx.fillStyle = '#00E5B8';
            ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('[Spasi] Potret UPT & Angkat Jaring', 0, -28);
          }
        }
        ctx.restore();
      }

      // 7. Render 12 Reef Fish Species (Indikator, Target, Mayor) with Authentic Morphology
      for (const fauna of sim.faunaList) {
        ctx.save();
        ctx.translate(fauna.x, fauna.y);
        const r = fauna.species.sizeRadius;

        const distToDiver = Math.hypot(sim.diver.x - fauna.x, sim.diver.y - fauna.y);
        if (sim.state !== 'title' && distToDiver < 155 + sim.diver.scannerRangeBonus) {
          ctx.beginPath();
          ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
          ctx.strokeStyle = fauna.scannedOnce ? '#00E5B8' : '#38BDF8';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = fauna.scannedOnce ? '#00E5B8' : '#38BDF8';
          ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            fauna.scannedOnce
              ? `UVC [${fauna.species.functionalGroup}]: ${fauna.species.name} (TL ${fauna.species.meanLengthCm}cm)`
              : `[Spasi] Sensus UVC: ${fauna.species.name} (${fauna.species.functionalGroup})`,
            0,
            -r - 16
          );
        }

        ctx.scale(fauna.facing, 1);
        ctx.fillStyle = fauna.hitFlash > 0 ? '#FFFFFF' : fauna.species.colorPrimary;
        ctx.strokeStyle = '#03101A';
        ctx.lineWidth = 2;

        // Main Fish Body
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.64, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Morphological Pattern Details (Chevron / Stripes / Spots)
        if (fauna.species.patternType === 'STRIPED') {
          ctx.strokeStyle = fauna.species.colorSecondary;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-r * 0.3, -r * 0.55);
          ctx.lineTo(-r * 0.3, r * 0.55);
          ctx.moveTo(r * 0.2, -r * 0.55);
          ctx.lineTo(r * 0.2, r * 0.55);
          ctx.stroke();
        } else if (fauna.species.patternType === 'CHEVRON') {
          ctx.strokeStyle = fauna.species.colorSecondary;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-4, -r * 0.45);
          ctx.lineTo(4, 0);
          ctx.lineTo(-4, r * 0.45);
          ctx.stroke();
        }

        // Tail fin animated with swimPhase
        const tailSwing = Math.sin(fauna.swimPhase * 2) * 5;
        ctx.fillStyle = fauna.species.colorSecondary;
        ctx.strokeStyle = '#03101A';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-r + 2, 0);
        ctx.lineTo(-r - 12, -r * 0.55 + tailSwing);
        ctx.lineTo(-r - 12, r * 0.55 + tailSwing);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(r * 0.45, -r * 0.15, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#03101A';
        ctx.beginPath();
        ctx.arc(r * 0.5, -r * 0.15, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 8. Render Hazards & Visible Windup Telegraphs
      for (const haz of sim.hazards) {
        ctx.save();
        ctx.translate(haz.x, haz.y);

        if (haz.state === 'WINDUP') {
          ctx.save();
          if (haz.archetype === 'LIONFISH_CHARGER') {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(haz.aimAngle) * 190, Math.sin(haz.aimAngle) * 190);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, 44 + Math.sin(sim.time * 24) * 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          ctx.fillStyle = '#FCA5A5';
          ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('AWAS SERANGAN!', 0, -34);
          ctx.restore();
        }

        ctx.scale(haz.scaleX, haz.scaleY);
        ctx.fillStyle =
          haz.hitFlash > 0
            ? '#FFFFFF'
            : haz.state === 'WINDUP'
            ? '#EF4444'
            : haz.archetype === 'BOX_JELLY'
            ? '#C084FC'
            : haz.archetype === 'LIONFISH_CHARGER'
            ? '#EA580C'
            : '#BE123C';
        ctx.strokeStyle = '#03101A';
        ctx.lineWidth = 2.2;

        if (haz.archetype === 'BOX_JELLY') {
          ctx.beginPath();
          ctx.arc(0, 0, 18, Math.PI, 0);
          ctx.lineTo(18, 10);
          ctx.lineTo(-18, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (haz.archetype === 'LIONFISH_CHARGER') {
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          for (let s = 0; s < 10; s++) {
            const ang = (s * Math.PI) / 5;
            const rad = s % 2 === 0 ? 24 : 11;
            const sx = Math.cos(ang) * rad;
            const sy = Math.sin(ang) * rad;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 9. Render Player Diver & Underwater Slate
      const d = sim.diver;
      if (d.actionPulseTimer > 0) {
        ctx.save();
        const progress = 1 - d.actionPulseTimer / 0.32;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.actionPulseRadius * progress, 0, Math.PI * 2);
        ctx.strokeStyle = d.actionPulseColor;
        ctx.lineWidth = 3 * (1 - progress);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.tiltAngle);
      ctx.scale(d.facing * d.scaleX, d.scaleY);

      const headlampGrad = ctx.createRadialGradient(18, -2, 4, 95, 0, 140);
      headlampGrad.addColorStop(0, 'rgba(125, 211, 252, 0.28)');
      headlampGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');
      ctx.fillStyle = headlampGrad;
      ctx.beginPath();
      ctx.moveTo(16, -4);
      ctx.lineTo(165, -52);
      ctx.lineTo(165, 52);
      ctx.closePath();
      ctx.fill();

      const kick = Math.sin(d.swimDistCycle) * 7;
      ctx.fillStyle = '#00E5B8';
      ctx.strokeStyle = '#03101A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-22, 2);
      ctx.lineTo(-42, -6 + kick);
      ctx.lineTo(-42, 8 + kick);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.roundRect(-14, -15, 22, 10, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = d.hitFlash > 0 ? '#FFFFFF' : '#0EA5E9';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(16, -2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.ellipse(19, -2, 5.5, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 10. Render Pooled Particles
      for (let i = 0; i < sim.particles.length; i++) {
        const p = sim.particles[i];
        if (!p.active) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      // 11. Weather Visibility Fog Overlay
      const weatherFx = computeWeatherEffects(sim.weather, sim.diver.coralShieldBonus);
      if (weatherFx.fogOpacity > 0.02 && sim.state === 'playing') {
        const diverScreenX = sim.diver.x - sim.camX;
        const diverScreenY = sim.diver.y - sim.camY;
        const visGrad = ctx.createRadialGradient(
          diverScreenX,
          diverScreenY,
          weatherFx.visibilityRadiusPx * 0.35,
          diverScreenX,
          diverScreenY,
          weatherFx.visibilityRadiusPx
        );
        visGrad.addColorStop(0, 'rgba(3, 16, 26, 0)');
        visGrad.addColorStop(1, `rgba(3, 16, 26, ${weatherFx.fogOpacity})`);
        ctx.fillStyle = visGrad;
        ctx.fillRect(0, 0, vw, vh);
      }

      if (sim.lightningFlash > 0) {
        ctx.fillStyle = `rgba(224, 242, 254, ${sim.lightningFlash * 0.35})`;
        ctx.fillRect(0, 0, vw, vh);
      }

      ctx.restore();
      sim.keysJustPressed.clear();
      sim.mouseJustPressed = false;
      frameTimerId = window.setTimeout(() => {
        rafId = window.requestAnimationFrame(tick);
      }, 16);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(frameTimerId);
      window.cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearInputsOnBlur);
    };
  }, [executeDiverAction, initWorldSimulation, showToast, spawnParticles, startGame, triggerWeatherChange]);

  const activeMission = missions[Math.min(activeMissionIndex, missions.length - 1)];
  const sampledStationsCount = transectStations.filter((s) => s.recordedLifeformCode !== null).length;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#041421] select-none">
      <canvas
        ref={canvasRef}
        data-testid="reef-canvas"
        onMouseDown={() => {
          if (simRef.current.state === 'playing' && !simRef.current.isLogbookOpen) {
            executeDiverAction();
          }
        }}
        className="block w-full h-full cursor-crosshair"
      />

      {gameState === 'title' && (
        <TitleOverlay
          onStartGame={startGame}
          onOpenLogbook={(tab) => openLogbookWithTab(tab || 'METODE_PRA_SELAM')}
          selectedMethod={selectedMethod}
          onSelectMethod={(m) => setSelectedMethod(m)}
          discoveredCount={discoveredSpeciesIds.length}
          totalSpecies={MARINE_SPECIES.length}
          bestScore={bestScore}
        />
      )}

      {gameState !== 'title' && (
        <GameHud
          hp={hp}
          maxHp={maxHp}
          oxygen={oxygen}
          ghostOxygen={ghostOxygen}
          maxOxygen={maxOxygen}
          depthMeters={depthMeters}
          zoneLabel={zoneLabel}
          score={score}
          reefHealth={reefHealth}
          sampledStationsCount={sampledStationsCount}
          totalStationsCount={transectStations.length}
          discoveredCount={discoveredSpeciesIds.length}
          coralSeedsStock={coralSeedsStock}
          activeTool={activeTool}
          selectedMethod={selectedMethod}
          onSelectMethodAndTool={(method, tool) => {
            simRef.current.selectedMethod = method;
            simRef.current.diver.activeTool = tool;
            setSelectedMethod(method);
            setActiveTool(tool);
          }}
          currentWeather={currentWeather}
          weatherTimerSec={weatherTimerSec}
          onCycleWeather={() => triggerWeatherChange()}
          activeMission={activeMission}
          activeMissionIndex={activeMissionIndex}
          totalMissions={missions.length}
          isMuted={isMuted}
          onToggleMute={() => {
            soundEngine.muted = !soundEngine.muted;
            setIsMuted(soundEngine.muted);
          }}
          onOpenLogbook={(tab) => openLogbookWithTab(tab || 'LEMBAR_DATA')}
          onTogglePause={() => {
            if (gameState === 'playing') {
              setGameState('paused');
            } else if (gameState === 'paused') {
              setGameState('playing');
            }
          }}
          onRestart={startGame}
          toastBanner={toastBanner}
        />
      )}

      {(gameState === 'paused' || gameState === 'gameover') && !isLogbookOpen && (
        <StatusModal
          state={gameState}
          snapshot={runSnapshot}
          onResume={() => setGameState('playing')}
          onRestart={startGame}
          onReturnTitle={() => {
            setGameState('title');
          }}
          onOpenLogbook={() => openLogbookWithTab('LEMBAR_DATA')}
        />
      )}

      <LogbookModal
        isOpen={isLogbookOpen}
        initialTab={logbookInitialTab}
        onClose={() => setIsLogbookOpen(false)}
        selectedMethod={selectedMethod}
        onSelectMethod={(m) => setSelectedMethod(m)}
        transectStations={transectStations}
        uvcLogs={uvcLogs}
        discoveredSpeciesIds={discoveredSpeciesIds}
        unlockedBadgeIds={unlockedBadgeIds}
        missions={missions}
        activeMissionIndex={activeMissionIndex}
        currentWeather={currentWeather}
        onTriggerWeatherChange={(w) => triggerWeatherChange(w)}
      />
    </main>
  );
}
