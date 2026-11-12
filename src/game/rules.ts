export type MarineZone = 'LAMUN_BAKAU' | 'TERUMBU_INTI' | 'PALUNG_DALAM';

export type WeatherType = 'CERAH' | 'HUJAN' | 'UPWELLING' | 'BADAI';

export type SurveyMethodType = 'PIT' | 'LIT' | 'UPT' | 'UVC';

export type ToolType = 'CLEANER' | 'SCANNER' | 'CORAL_SEED' | 'PATROL_CUTTER';

export type CoralCategoryGroup =
  | 'ACROPORA'
  | 'NON_ACROPORA'
  | 'BIOTA_LAIN'
  | 'ABIOTIK_KARANG_MATI';

export interface CoralLifeformSpec {
  code: string;
  name: string;
  indonesianName: string;
  categoryGroup: CoralCategoryGroup;
  isHardCoral: boolean; // Counts toward % Live Hard Coral Cover (HC)
  exampleGenus: string;
  morphologyDescription: string;
  ecologicalIndicator: string;
  depthDistribution: string;
  colorPrimary: string;
  colorSecondary: string;
  shapeType: 'BRANCHING' | 'TABULATE' | 'MASSIVE' | 'FOLIOSE' | 'MUSHROOM' | 'SUBMASSIVE' | 'SOFT' | 'RUBBLE_DEAD';
}

export type FishFunctionalGroup = 'INDIKATOR' | 'TARGET' | 'MAYOR';

export interface MarineSpecies {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  functionalGroup: FishFunctionalGroup;
  functionalGroupLabel: string;
  zone: MarineZone;
  zoneLabel: string;
  preferredWeather: WeatherType[];
  rarity: 'UMUM' | 'LANGKA' | 'ENDEMIK_DILINDUNGI';
  pointsBonus: number;
  habitat: string;
  faktaMenarik: string;
  ecologicalRole: string;
  identificationKey: string; // Morphological traits for UVC visual identification
  meanLengthCm: number; // Average Total Length (TL cm)
  lwA: number; // Length-Weight constant 'a' (W = a * L^b in grams)
  lwB: number; // Length-Weight exponent 'b'
  colorPrimary: string;
  colorSecondary: string;
  patternType: 'STRIPED' | 'CHEVRON' | 'SPOTTED' | 'SOLID_FIN' | 'DISK';
  sizeRadius: number;
  baseSpeed: number;
}

export interface SurveyMethodGuide {
  id: SurveyMethodType;
  code: SurveyMethodType;
  fullName: string;
  indonesianTitle: string;
  equipmentList: string[];
  transectSpec: string;
  preDiveProcedure: string[];
  inWaterProcedure: string[];
  formulaText: string;
  scientificPurpose: string;
  toolMapping: ToolType;
}

export interface TransectStationRecord {
  stationId: number;
  meterMark: number; // e.g., 5m, 10m, 15m ... up to 50m
  trueLifeformCode: string;
  recordedLifeformCode: string | null;
  interceptLengthCm: number; // For LIT (out of 500cm segment, live coral intercept length)
  totalSegmentCm: number;
  uptPointCodes: string[]; // 5 quadrat grid points for UPT
  sampledByMethods: SurveyMethodType[];
  isClassificationAccurate: boolean;
}

export interface UvcFishLogEntry {
  speciesId: string;
  countIndividuals: number;
  estimatedLengthCm: number;
  totalBiomassGrams: number;
}

export interface CollectionBadge {
  id: string;
  title: string;
  description: string;
  requiredCount?: number;
  requiredZone?: MarineZone;
  requiredRarity?: MarineSpecies['rarity'];
  bonusScore: number;
}

export interface MissionObjective {
  id: string;
  type: 'CLEAN_TRASH' | 'TRANSPLANT_CORAL' | 'STOP_ILLEGAL_GEAR' | 'SCAN_SPECIES' | 'REACH_REEF_HEALTH';
  label: string;
  target: number;
  current: number;
}

export interface MissionDefinition {
  id: number;
  title: string;
  zoneFocus: string;
  briefing: string;
  difficultyLabel: string;
  weatherWarning: string;
  objectives: MissionObjective[];
  rewardPoints: number;
  rewardTitle: string;
  rewardUpgradeDesc: string;
  upgradeEffect: {
    maxO2Bonus: number;
    swimSpeedMultiplier: number;
    scannerRangeBonus: number;
    coralShieldBonus: number;
  };
}

export interface WeatherConfig {
  id: WeatherType;
  name: string;
  subtitle: string;
  visibilityFactor: number;
  currentForceX: number;
  currentForceY: number;
  coralHealthRatePerSec: number;
  stormWaveIntensity: number;
  migrationMultiplier: Record<MarineSpecies['rarity'], number>;
  gameplayTip: string;
}

// ============================================================================
// 1. SCIENTIFIC SURVEY METHODS GUIDE (PIT, LIT, UPT, UVC)
// ============================================================================
export const SURVEY_METHODS_GUIDE: Record<SurveyMethodType, SurveyMethodGuide> = {
  PIT: {
    id: 'PIT',
    code: 'PIT',
    fullName: 'Point Intercept Transect',
    indonesianTitle: 'Transek Titik Singgung (PIT)',
    equipmentList: [
      'Roll meter fiberglass 50 meter',
      'Sabak bawah air (Underwater Slate) & pensil 2B',
      'Pemberat & pelampung penanda transek',
      'Depth gauge & kompas selam',
    ],
    transectSpec: 'Pita transek 50m dibentangkan sejajar garis pantai (kontur kedalaman konstan 5m–10m); pengamatan titik setiap interval 0,5m.',
    preDiveProcedure: [
      'Tentukan titik koordinat GPS stasiun terumbu dan periksa visibilitas serta arah arus permukaan.',
      'Kalibrasi kedalaman penyelaman (umumnya 5 meter untuk rataan terumbu dan 10 meter untuk lereng terumbu).',
      'Siapkan kode baku Benthic Lifeform (ACB, ACT, CM, CF, CMR, SC, DCA, RB, SD) pada lembar kerja sabak.',
    ],
    inWaterProcedure: [
      'Bentangkan pita roll meter sepanjang 50 meter sejajar kontur kedalaman tanpa merusak polip karang.',
      'Berenang tepat di atas pita transek dan catat kode kategori lifeform yang berada persis di titik penanda meteran.',
      'Hitung proporsi titik Karang Keras Hidup (Hard Coral / HC) terhadap total titik pengamatan.',
    ],
    formulaText: '% Tutupan Karang Hidup (HC) = (Jumlah Titik HC / Total Titik Sampel) × 100%',
    scientificPurpose: 'Metode cepat dan akurat standar COREMAP-CTI untuk memantau persentase tutupan bentik terumbu karang secara berkala.',
    toolMapping: 'CLEANER',
  },
  LIT: {
    id: 'LIT',
    code: 'LIT',
    fullName: 'Line Intercept Transect',
    indonesianTitle: 'Transek Garis Singgung (LIT)',
    equipmentList: [
      'Roll meter fiberglass 50m dengan ketelitian sentimeter (cm)',
      'Sabak bawah air & lembar tabel transisi sentimeter',
      'Kaliper bawah air untuk verifikasi batas koloni',
    ],
    transectSpec: 'Pengukuran panjang intersep kontinu (dalam cm) setiap koloni karang dan substrat yang dilewati garis pita transek.',
    preDiveProcedure: [
      'Latih konsistensi identifikasi batas koloni karang (membedakan koloni hidup, karang mati tertutup alga DCA, dan patahan karang RB).',
      'Pastikan penyelam pengamat menjaga sudut pandang tegak lurus (90 derajat / paralaks nol) terhadap pita meteran.',
    ],
    inWaterProcedure: [
      'Catat titik transisi awal dan akhir dalam sentimeter (misal: 0–85 cm = ACT, 85–150 cm = CM, 150–200 cm = RB).',
      'Ukur panjang intersep setiap bentuk pertumbuhan (lifeform) karang dengan presisi hingga 1 cm.',
      'Jumlahkan panjang intersep masing-masing lifeform dibagi total panjang garis transek.',
    ],
    formulaText: '% Tutupan Lifeform = (Σ Panjang Intersep Lifeform (cm) / Total Panjang Transek (cm)) × 100%',
    scientificPurpose: 'Standar AIMS (English et al.) untuk memperoleh profil struktur komunitas karang dan ukuran koloni secara presisi tinggi.',
    toolMapping: 'CORAL_SEED',
  },
  UPT: {
    id: 'UPT',
    code: 'UPT',
    fullName: 'Underwater Photo Transect',
    indonesianTitle: 'Transek Foto Bawah Air (UPT)',
    equipmentList: [
      'Kamera digital bawah air (Underwater Housing) + lampu strobo',
      'Bingkai kuadrat besi/PVC ukuran 58 cm × 44 cm',
      'Roll meter 50 meter',
      'Perangkat lunak analisis titik kuadrat (CPCe / CoralNet)',
    ],
    transectSpec: 'Pemotretan tegak lurus bingkai kuadrat 58 × 44 cm pada setiap meter ke-1 hingga ke-50 sepanjang garis transek.',
    preDiveProcedure: [
      'Periksa O-ring kamera underwater housing, white balance bawah air, dan pastikan lensa wide bebas embun.',
      'Tentukan protokol kuadrat: meter ganjil di sisi kiri pita, atau seluruh meter di sisi darat/laut secara konsisten.',
    ],
    inWaterProcedure: [
      'Letakkan bingkai kuadrat 58 × 44 cm pada stasiun meteran dan ambil foto tegak lurus berjarak ±60 cm dari substrat.',
      'Analisis setiap bingkai foto menggunakan tebaran titik sampel (grid points) untuk mengidentifikasi lifeform di bawah tiap titik.',
      'Arsipkan foto kuadrat sebagai bukti permanen perubahan kondisi karang antar-tahun.',
    ],
    formulaText: '% Tutupan Kategori = (Jumlah Titik Kategori pada Seluruh Bingkai Foto / Total Titik Seluruh Foto) × 100%',
    scientificPurpose: 'Meminimalkan waktu kerja di bawah air dan menyediakan arsip visual permanen yang dapat diverifikasi ulang di laboratorium.',
    toolMapping: 'PATROL_CUTTER',
  },
  UVC: {
    id: 'UVC',
    code: 'UVC',
    fullName: 'Underwater Visual Census',
    indonesianTitle: 'Sensus Visual Ikan Karang (UVC)',
    equipmentList: [
      'Roll meter 50m (lebar koridor pengamatan 2,5m kiri & 2,5m kanan = luas 250 m²)',
      'Sabak daftar spesies ikan karang (Indikator, Target, Mayor)',
      'Panduan kalibrasi estimasi Panjang Total (Total Length / TL cm)',
    ],
    transectSpec: 'Belt Transect 50m × 5m (luas sabuk 250 m²); sensus dilakukan 5–15 menit setelah pita digelar agar ikan kembali normal.',
    preDiveProcedure: [
      'Kuasai identifikasi morfologi 3 kelompok fungsional ikan karang: Ikan Indikator (Chaetodontidae), Ikan Target (Serranidae, Scaridae, Lutjanidae, Labridae), dan Ikan Mayor (Pomacentridae).',
      'Latih akurasi estimasi Panjang Total (TL dalam cm) di bawah air karena efek pembiasan masker memperbesar objek ~25%.',
    ],
    inWaterProcedure: [
      'Tunggu ±5 menit setelah pembentangan pita transek agar ikan yang bersembunyi keluar kembali.',
      'Berenang perlahan secara konstan sepanjang garis tengah sambil mencatat spesies, jumlah individu, dan estimasi panjang (cm) dalam koridor 2,5m kiri-kanan.',
      'Hitung Kelimpahan (ind/ha) dan Biomassa Ikan Target menggunakan persamaan hubungan panjang-berat W = a × L^b.',
    ],
    formulaText: 'Kelimpahan = Σ Individu / 250 m² · Biomassa (g) = Σ (a × TL^b)',
    scientificPurpose: 'Mengukur kelimpahan populasi ikan indikator kesehatan karang, stok biomassa ikan ekonomis, dan keanekaragaman trofik terumbu.',
    toolMapping: 'SCANNER',
  },
};

// ============================================================================
// 2. AUTHENTIC BENTHIC CORAL LIFEFORM CATALOG (STANDAR AIMS / COREMAP)
// ============================================================================
export const CORAL_LIFEFORMS: CoralLifeformSpec[] = [
  {
    code: 'ACB',
    name: 'Acropora Branching',
    indonesianName: 'Karang Acropora Bercabang (Karang Rusa)',
    categoryGroup: 'ACROPORA',
    isHardCoral: true,
    exampleGenus: 'Acropora formosa, Acropora cervicornis',
    morphologyDescription: 'Koloni bercabang menyerupai tanduk rusa dengan koralit aksial menonjol di ujung tiap cabang dan koralit radial di sekeliling batang.',
    ecologicalIndicator: 'Tumbuh sangat cepat (10–15 cm/tahun) dan menjadi habitat utama berlindung ikan betok (Pomacentridae), namun paling rentan terhadap pemutihan suhu tinggi dan gelombang badai.',
    depthDistribution: 'Rataan terumbu dangkal hingga lereng atas (2–12 meter).',
    colorPrimary: '#FF6B4A',
    colorSecondary: '#FED7AA',
    shapeType: 'BRANCHING',
  },
  {
    code: 'ACT',
    name: 'Acropora Tabulate',
    indonesianName: 'Karang Meja Acropora',
    categoryGroup: 'ACROPORA',
    isHardCoral: true,
    exampleGenus: 'Acropora hyacinthus, Acropora cytherea',
    morphologyDescription: 'Membentuk lempengan datar horisontal menyerupai meja bertingkat yang ditopang oleh batang tengah atau samping untuk memaksimalkan tangkapan cahaya.',
    ecologicalIndicator: 'Arsitek kanopi terumbu karang yang menyediakan naungan bagi ikan kerapu, kakap, dan ikan kepe-kepe.',
    depthDistribution: 'Tepian lereng terumbu berarus jernih (3–15 meter).',
    colorPrimary: '#F43F5E',
    colorSecondary: '#FECDD3',
    shapeType: 'TABULATE',
  },
  {
    code: 'CM',
    name: 'Coral Massive',
    indonesianName: 'Karang Masif / Karang Otak & Bongkahan',
    categoryGroup: 'NON_ACROPORA',
    isHardCoral: true,
    exampleGenus: 'Porites lutea, Platygyra daedalea, Favia pallida',
    morphologyDescription: 'Koloni padat berbentuk kubah atau bola besar seperti batu/otak dengan struktur rangka kalsium karbonat yang sangat kokoh.',
    ecologicalIndicator: 'Pertumbuhan lambat (±1 cm/tahun) tetapi sangat tahan terhadap hantaman gelombang badai dan perubahan suhu; berfungsi sebagai rekaman iklim purba.',
    depthDistribution: 'Laguna dangkal hingga lereng terumbu dalam (1–30 meter).',
    colorPrimary: '#10B981',
    colorSecondary: '#A7F3D0',
    shapeType: 'MASSIVE',
  },
  {
    code: 'CF',
    name: 'Coral Foliose',
    indonesianName: 'Karang Lembaran / Kelopak Bunga',
    categoryGroup: 'NON_ACROPORA',
    isHardCoral: true,
    exampleGenus: 'Montipora aequituberculata, Turbinaria reniformis, Echinopora',
    morphologyDescription: 'Tumbuh dalam bentuk lembaran tipis melingkar menyerupai kelopak bunga mawar atau kubis yang saling bertumpuk.',
    ecologicalIndicator: 'Sangat efisien menangkap cahaya pada perairan yang lebih dalam atau agak keruh; celah lembaran menjadi tempat persembunyian krustasea.',
    depthDistribution: 'Lereng tengah hingga dalam (8–25 meter).',
    colorPrimary: '#06B6D4',
    colorSecondary: '#BAE6FD',
    shapeType: 'FOLIOSE',
  },
  {
    code: 'CMR',
    name: 'Coral Mushroom',
    indonesianName: 'Karang Jamur Soliter',
    categoryGroup: 'NON_ACROPORA',
    isHardCoral: true,
    exampleGenus: 'Fungia fungites, Heliofungia actiniformis',
    morphologyDescription: 'Polip tunggal soliter berbentuk cakram oval atau bulat dengan septa bergerigi menyebar dari mulut tengah layaknya bilah bawah jamur.',
    ecologicalIndicator: 'Hidup bebas tidak melekat permanen di batuan pada fase dewasa dan mampu bergerak perlahan di atas pasir terumbu.',
    depthDistribution: 'Rataan pasir terumbu dan lereng bawah (3–20 meter).',
    colorPrimary: '#A855F7',
    colorSecondary: '#E9D5FF',
    shapeType: 'MUSHROOM',
  },
  {
    code: 'CB',
    name: 'Coral Branching (Non-Acropora)',
    indonesianName: 'Karang Bercabang Non-Acropora (Karang Jahe)',
    categoryGroup: 'NON_ACROPORA',
    isHardCoral: true,
    exampleGenus: 'Pocillopora damicornis, Seriatopora hystrix, Stylophora',
    morphologyDescription: 'Koloni bercabang rapat tanpa koralit aksial di ujung cabang; ujung cabang cenderung tumpul menggelembung atau meruncing halus seperti jarum.',
    ecologicalIndicator: 'Spesies pionir yang cepat mengkolonisasi substrat baru dan bersimbiosis dengan kepiting penjaga Trapezia.',
    depthDistribution: 'Terumbu dangkal berenergi gelombang sedang (1–15 meter).',
    colorPrimary: '#F59E0B',
    colorSecondary: '#FEF08A',
    shapeType: 'SUBMASSIVE',
  },
  {
    code: 'SC',
    name: 'Soft Coral',
    indonesianName: 'Karang Lunak & Kipas Laut Gorgonia',
    categoryGroup: 'BIOTA_LAIN',
    isHardCoral: false,
    exampleGenus: 'Sarcophyton, Sinularia, Dendronephthya, Muricella',
    morphologyDescription: 'Tidak membentuk kerangka kalsium karbonat masif, melainkan diperkuat oleh spikula mikroskopis kalkareus (sklerit) yang lentur mengikuti arus.',
    ecologicalIndicator: 'Menghasilkan senyawa metabolit sekunder terpenoid sebagai pertahanan kimiawi dan menjadi rumah eksklusif Kuda Laut Kerdil.',
    depthDistribution: 'Lereng terumbu berarus sedang hingga kuat (5–35 meter).',
    colorPrimary: '#EC4899',
    colorSecondary: '#FBCFE8',
    shapeType: 'SOFT',
  },
  {
    code: 'DCA',
    name: 'Dead Coral with Algae / Rubble',
    indonesianName: 'Karang Mati Tertutup Alga & Patahan Karang (DCA/RB)',
    categoryGroup: 'ABIOTIK_KARANG_MATI',
    isHardCoral: false,
    exampleGenus: 'Kerangka kalsium karbonat mati tertutup Turf Algae',
    morphologyDescription: 'Struktur karang yang telah kehilangan jaringan polip hidup akibat pemutihan termal, predasi Acanthaster, atau jaring ilegal dan ditumbuhi alga filamen.',
    ecologicalIndicator: 'Tingginya persentase DCA/RB menandakan degradasi terumbu; memerlukan kehadiran ikan herbivora (Parrotfish/Botana) atau restorasi transplantasi.',
    depthDistribution: 'Seluruh kedalaman terdampak gangguan.',
    colorPrimary: '#94A3B8',
    colorSecondary: '#CBD5E1',
    shapeType: 'RUBBLE_DEAD',
  },
];

// ============================================================================
// 3. AUTHENTIC REEF FISH CATALOG FOR UVC CENSUS (INDIKATOR, TARGET, MAYOR)
// ============================================================================
export const MARINE_SPECIES: MarineSpecies[] = [
  {
    id: 'chaetodon_trifascialis',
    name: 'Kepe-Kepe Chevron (Triangulate)',
    scientificName: 'Chaetodon trifascialis',
    family: 'Chaetodontidae',
    functionalGroup: 'INDIKATOR',
    functionalGroupLabel: 'Ikan Indikator Kesehatan Karang',
    zone: 'TERUMBU_INTI',
    zoneLabel: 'Terumbu Karang Inti',
    preferredWeather: ['CERAH', 'HUJAN'],
    rarity: 'LANGKA',
    pointsBonus: 220,
    habitat: 'Hidup berpasangan secara teritorial di sekitar koloni karang meja Acropora (ACT).',
    faktaMenarik: 'Spesies obligate corallivore murni yang hanya memakan polip dan lendir karang Acropora; jika karang meja mati, spesies ini menghilang.',
    ecologicalRole: 'Bio-indikator utama tutupan karang Acropora sehat dalam survei UVC.',
    identificationKey: 'Tubuh pipih putih dengan garis-garis hitam berbentuk siku (chevron "<") dan garis hitam vertikal melalui mata.',
    meanLengthCm: 14,
    lwA: 0.024,
    lwB: 2.98,
    colorPrimary: '#FACC15',
    colorSecondary: '#0F172A',
    patternType: 'CHEVRON',
    sizeRadius: 16,
    baseSpeed: 54,
  },
  {
    id: 'chelmon_rostratus',
    name: 'Ikan Kepe-Kepe Monyong (Copperband)',
    scientificName: 'Chelmon rostratus',
    family: 'Chaetodontidae',
    functionalGroup: 'INDIKATOR',
    functionalGroupLabel: 'Ikan Indikator Kesehatan Karang',
    zone: 'LAMUN_BAKAU',
    zoneLabel: 'Padang Lamun & Rataan Karang',
    preferredWeather: ['CERAH', 'HUJAN'],
    rarity: 'UMUM',
    pointsBonus: 160,
    habitat: 'Rataan terumbu berpasir, celah karang masif, dan perairan sekitar ekosistem lamun.',
    faktaMenarik: 'Memiliki moncong panjang menyerupai pinset untuk menjangkau polip dan invertebrata kecil di celah karang sempit.',
    ecologicalRole: 'Indikator kekayaan mikro-invertebrata bentik dan keragaman struktur celah karang.',
    identificationKey: 'Empat pita vertikal oranye-tembaga dengan bintik mata palsu (ocellus) hitam bertepi putih di sirip punggung belakang.',
    meanLengthCm: 16,
    lwA: 0.022,
    lwB: 3.01,
    colorPrimary: '#F59E0B',
    colorSecondary: '#FFFFFF',
    patternType: 'STRIPED',
    sizeRadius: 17,
    baseSpeed: 56,
  },
  {
    id: 'heniochus_acuminatus',
    name: 'Kepe-Kepe Bendera (Longfin Bannerfish)',
    scientificName: 'Heniochus acuminatus',
    family: 'Chaetodontidae',
    functionalGroup: 'INDIKATOR',
    functionalGroupLabel: 'Ikan Indikator Kesehatan Karang',
    zone: 'TERUMBU_INTI',
    zoneLabel: 'Terumbu Karang Inti',
    preferredWeather: ['CERAH', 'UPWELLING'],
    rarity: 'UMUM',
    pointsBonus: 180,
    habitat: 'Lereng terumbu karang luar dan laguna dalam (3–25 meter).',
    faktaMenarik: 'Jari-jari keempat sirip punggungnya memanjang putih menjuntai seperti bendera kapal.',
    ecologicalRole: 'Indikator kualitas perairan terumbu dan pemangsa zooplankton serta polip bentik.',
    identificationKey: 'Dua pita lebar hitam miring di tubuh putih dengan filamen sirip punggung panjang dan sirip ekor kuning.',
    meanLengthCm: 18,
    lwA: 0.025,
    lwB: 2.95,
    colorPrimary: '#F8FAFC',
    colorSecondary: '#FACC15',
    patternType: 'STRIPED',
    sizeRadius: 18,
    baseSpeed: 58,
  },
  {
    id: 'chlorurus_microrhinos',
    name: 'Ikan Kakatua Hijau (Steephead Parrotfish)',
    scientificName: 'Chlorurus microrhinos',
    family: 'Scaridae',
    functionalGroup: 'TARGET',
    functionalGroupLabel: 'Ikan Target / Herbivora Kunci',
    zone: 'TERUMBU_INTI',
    zoneLabel: 'Terumbu Karang Inti',
    preferredWeather: ['CERAH', 'UPWELLING'],
    rarity: 'LANGKA',
    pointsBonus: 260,
    habitat: 'Puncak dan lereng terumbu karang luar yang kaya substrat karbonat.',
    faktaMenarik: 'Gigi yang menyatu menjadi paruh kuat mampu mengerok alga pada karang mati (DCA) dan menghasilkan hingga ratusan kilogram pasir putih halus per tahun.',
    ecologicalRole: 'Herbivora excavator yang membersihkan permukaan substrat karang mati agar larva karang baru (planula) dapat menempel.',
    identificationKey: 'Tubuh hijau kebiruan besar dengan dahi tegak menonjol (steephead) dan gigi menyatu membentuk paruh.',
    meanLengthCm: 42,
    lwA: 0.019,
    lwB: 3.04,
    colorPrimary: '#0D9488',
    colorSecondary: '#2DD4BF',
    patternType: 'SOLID_FIN',
    sizeRadius: 27,
    baseSpeed: 60,
  },
  {
    id: 'cheilinus_undulatus',
    name: 'Ikan Napoleon (Humphead Wrasse)',
    scientificName: 'Cheilinus undulatus',
    family: 'Labridae',
    functionalGroup: 'TARGET',
    functionalGroupLabel: 'Ikan Target / Spesies Dilindungi (CITES App II)',
    zone: 'PALUNG_DALAM',
    zoneLabel: 'Lereng & Palung Dalam',
    preferredWeather: ['CERAH', 'UPWELLING', 'BADAI'],
    rarity: 'ENDEMIK_DILINDUNGI',
    pointsBonus: 360,
    habitat: 'Tebing drop-off terumbu karang dan saluran laguna dalam (10–60 meter).',
    faktaMenarik: 'Predator alami Bintang Laut Mahkota Duri (Acanthaster planci) dan keong Triton yang menjaga terumbu dari ledakan hama pemakan karang.',
    ecologicalRole: 'Predator kunci pengendali hama terumbu dan bio-indikator tekanan penangkapan ikan.',
    identificationKey: 'Tonjolan punuk besar di dahi, bibir tebal, serta dua garis hitam di belakang mata dengan pola retikulasi hijau-biru.',
    meanLengthCm: 68,
    lwA: 0.017,
    lwB: 3.06,
    colorPrimary: '#0284C7',
    colorSecondary: '#38BDF8',
    patternType: 'SPOTTED',
    sizeRadius: 34,
    baseSpeed: 50,
  },
  {
    id: 'epinephelus_fuscoguttatus',
    name: 'Kerapu Macan (Brown-Marbled Grouper)',
    scientificName: 'Epinephelus fuscoguttatus',
    family: 'Serranidae',
    functionalGroup: 'TARGET',
    functionalGroupLabel: 'Ikan Target / Predator Ekonomis Penting',
    zone: 'PALUNG_DALAM',
    zoneLabel: 'Lereng & Palung Dalam',
    preferredWeather: ['HUJAN', 'UPWELLING', 'BADAI'],
    rarity: 'ENDEMIK_DILINDUNGI',
    pointsBonus: 310,
    habitat: 'Gua karang, celah karang masif (CM), dan tebing lereng terumbu.',
    faktaMenarik: 'Bersifat hermafrodit protogini (lahir sebagai betina lalu berubah menjadi jantan saat mencapai ukuran besar >60 cm).',
    ecologicalRole: 'Predator penyergap bentik yang mengontrol populasi ikan kecil dan kepiting terumbu.',
    identificationKey: 'Tubuh kekar kecokelatan dengan bercak marmer gelap tidak beraturan dan pelana hitam kecil di pangkal ekor.',
    meanLengthCm: 52,
    lwA: 0.016,
    lwB: 3.08,
    colorPrimary: '#B45309',
    colorSecondary: '#FDE68A',
    patternType: 'SPOTTED',
    sizeRadius: 29,
    baseSpeed: 46,
  },
  {
    id: 'lutjanus_decussatus',
    name: 'Kakap Tambangan (Checkered Snapper)',
    scientificName: 'Lutjanus decussatus',
    family: 'Lutjanidae',
    functionalGroup: 'TARGET',
    functionalGroupLabel: 'Ikan Target / Karnivora Terumbu',
    zone: 'TERUMBU_INTI',
    zoneLabel: 'Terumbu Karang Inti',
    preferredWeather: ['CERAH', 'HUJAN', 'UPWELLING'],
    rarity: 'UMUM',
    pointsBonus: 210,
    habitat: 'Rataan terumbu hingga lereng karang pada kedalaman 3–25 meter.',
    faktaMenarik: 'Pola garis memanjang dan vertikal membentuk motif kotak-kotak papan catur yang menyamarkan siluetnya di antara bayangan cabang karang.',
    ecologicalRole: 'Karnivora mesopredator penting dalam jaring makanan terumbu karang.',
    identificationKey: 'Lima garis cokelat-merah horizontal yang dipotong garis vertikal membentuk pola kotak catur serta bercak hitam besar di pangkal ekor.',
    meanLengthCm: 28,
    lwA: 0.018,
    lwB: 3.02,
    colorPrimary: '#DC2626',
    colorSecondary: '#F8FAFC',
    patternType: 'STRIPED',
    sizeRadius: 22,
    baseSpeed: 62,
  },
  {
    id: 'paracanthurus_hepatus',
    name: 'Ikan Botana Biru (Palette Surgeonfish)',
    scientificName: 'Paracanthurus hepatus',
    family: 'Acanthuridae',
    functionalGroup: 'TARGET',
    functionalGroupLabel: 'Ikan Target / Pemakan Alga & Plankton',
    zone: 'TERUMBU_INTI',
    zoneLabel: 'Terumbu Karang Inti',
    preferredWeather: ['CERAH', 'HUJAN'],
    rarity: 'UMUM',
    pointsBonus: 170,
    habitat: 'Di atas koloni karang bercabang Pocillopora (CB) dan Acropora (ACB) berarus jernih.',
    faktaMenarik: 'Saat terancam predator, kawanan Botana Biru langsung menyelip masuk rapat di antara celah cabang karang Pocillopora.',
    ecologicalRole: 'Mengendalikan pertumbuhan makroalga pada terumbu karang.',
    identificationKey: 'Tubuh biru kobalt terang dengan pola hitam menyerupai palet lukis dan sirip ekor berbentuk segitiga kuning cerah.',
    meanLengthCm: 22,
    lwA: 0.023,
    lwB: 2.97,
    colorPrimary: '#2563EB',
    colorSecondary: '#FACC15',
    patternType: 'SOLID_FIN',
    sizeRadius: 18,
    baseSpeed: 65,
  },
  {
    id: 'siganus_vulpinus',
    name: 'Baronang Kuning (Foxface Rabbitfish)',
    scientificName: 'Siganus vulpinus',
    family: 'Siganidae',
    functionalGroup: 'TARGET',
    functionalGroupLabel: 'Ikan Target / Herbivora Padang Lamun & Karang',
    zone: 'LAMUN_BAKAU',
    zoneLabel: 'Padang Lamun & Rataan Karang',
    preferredWeather: ['CERAH', 'HUJAN'],
    rarity: 'UMUM',
    pointsBonus: 185,
    habitat: 'Zona transisi padang lamun, laguna bakau, dan hamparan karang bercabang.',
    faktaMenarik: 'Jari-jari keras sirip punggung dan duburnya memiliki kelenjar berbisa ringan untuk melindungi diri saat merumput alga di tempat terbuka.',
    ecologicalRole: 'Herbivora penghubung trofik antara ekosistem padang lamun dan terumbu karang.',
    identificationKey: 'Tubuh kuning cerah dengan moncong memanjang berpola belang hitam-putih seperti wajah rubah.',
    meanLengthCm: 21,
    lwA: 0.02,
    lwB: 3.0,
    colorPrimary: '#EAB308',
    colorSecondary: '#FFFFFF',
    patternType: 'STRIPED',
    sizeRadius: 19,
    baseSpeed: 58,
  },
  {
    id: 'chromis_viridis',
    name: 'Betok Hijau Karang (Blue-Green Chromis)',
    scientificName: 'Chromis viridis',
    family: 'Pomacentridae',
    functionalGroup: 'MAYOR',
    functionalGroupLabel: 'Ikan Mayor / Penghuni Koloni Acropora',
    zone: 'TERUMBU_INTI',
    zoneLabel: 'Terumbu Karang Inti',
    preferredWeather: ['CERAH', 'HUJAN', 'UPWELLING'],
    rarity: 'UMUM',
    pointsBonus: 130,
    habitat: 'Bergerombol padat melayang tepat di atas koloni karang bercabang Acropora (ACB) dan meja (ACT).',
    faktaMenarik: 'Saat tidur di malam hari di sela cabang karang, gerakan siripnya mengipasi polip karang sehingga meningkatkan sirkulasi oksigen bagi karang.',
    ecologicalRole: 'Mentransfer energi dari plankton kolom air ke ekosistem bentik terumbu karang melalui ekskresi nutrisi.',
    identificationKey: 'Tubuh kecil hijau apel berkilau kebiruan dengan ekor bercabang dalam (forked tail).',
    meanLengthCm: 8,
    lwA: 0.021,
    lwB: 2.94,
    colorPrimary: '#34D399',
    colorSecondary: '#67E8F9',
    patternType: 'SOLID_FIN',
    sizeRadius: 13,
    baseSpeed: 64,
  },
  {
    id: 'amphiprion_ocellaris',
    name: 'Ikan Badut Anemon (Ocellaris Clownfish)',
    scientificName: 'Amphiprion ocellaris',
    family: 'Pomacentridae',
    functionalGroup: 'MAYOR',
    functionalGroupLabel: 'Ikan Mayor / Simbion Anemon Terumbu',
    zone: 'LAMUN_BAKAU',
    zoneLabel: 'Padang Lamun & Rataan Karang',
    preferredWeather: ['CERAH', 'HUJAN', 'UPWELLING', 'BADAI'],
    rarity: 'UMUM',
    pointsBonus: 140,
    habitat: 'Bersimbiosis mutualisme dengan anemon laut Heteractis magnifica dan Stichodactyla gigantea.',
    faktaMenarik: 'Hidup dalam struktur sosial matriarkal; individu terbesar selalu betina, dan jika betina hilang maka pejantan dominan berubah menjadi betina.',
    ecologicalRole: 'Melindungi anemon inang dari ikan kepe-kepe pemakan tentakel dan memberikan amonia penyubur zooxanthellae.',
    identificationKey: 'Tubuh oranye terang dengan tiga pita putih vertikal bertepi garis hitam tipis dan sirip membulat.',
    meanLengthCm: 9,
    lwA: 0.024,
    lwB: 2.96,
    colorPrimary: '#FF6B2B',
    colorSecondary: '#FFFFFF',
    patternType: 'STRIPED',
    sizeRadius: 14,
    baseSpeed: 50,
  },
  {
    id: 'pomacentrus_moluccensis',
    name: 'Betok Kuning Ambon (Lemon Damselfish)',
    scientificName: 'Pomacentrus moluccensis',
    family: 'Pomacentridae',
    functionalGroup: 'MAYOR',
    functionalGroupLabel: 'Ikan Mayor / Spesies Penjaga Karang',
    zone: 'PALUNG_DALAM',
    zoneLabel: 'Lereng & Palung Dalam',
    preferredWeather: ['CERAH', 'UPWELLING', 'BADAI'],
    rarity: 'ENDEMIK_DILINDUNGI',
    pointsBonus: 195,
    habitat: 'Koloni karang bercabang Pocillopora dan Acropora pada kedalaman 3–20 meter.',
    faktaMenarik: 'Sangat setia pada satu koloni karang sepanjang hidupnya dan berani mengusir predator pemakan polip yang mendekat.',
    ecologicalRole: 'Indikator kelimpahan kelompok Ikan Mayor (Pomacentridae) pada sabuk transek UVC.',
    identificationKey: 'Seluruh tubuh dan sirip berwarna kuning lemon merata dengan satu titik hitam kecil di pangkal atas sirip dada.',
    meanLengthCm: 7.5,
    lwA: 0.022,
    lwB: 2.95,
    colorPrimary: '#FDE047',
    colorSecondary: '#FEF9C3',
    patternType: 'SOLID_FIN',
    sizeRadius: 13,
    baseSpeed: 58,
  },
];

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  CERAH: {
    id: 'CERAH',
    name: 'Cerah Tropis',
    subtitle: 'Visibilitas 100% · Ideal untuk Foto Kuadrat UPT & Sensus UVC',
    visibilityFactor: 1.0,
    currentForceX: 6,
    currentForceY: 0,
    coralHealthRatePerSec: 0.25,
    stormWaveIntensity: 0.1,
    migrationMultiplier: {
      UMUM: 1.2,
      LANGKA: 1.0,
      ENDEMIK_DILINDUNGI: 0.85,
    },
    gameplayTip: 'Kondisi pencahayaan terbaik untuk pengambilan data kuadrat UPT, PIT/LIT, dan sensus visual UVC.',
  },
  HUJAN: {
    id: 'HUJAN',
    name: 'Hujan Monsun',
    subtitle: 'Visibilitas 76% · Cahaya Bawah Air Redup',
    visibilityFactor: 0.76,
    currentForceX: 24,
    currentForceY: 5,
    coralHealthRatePerSec: 0.0,
    stormWaveIntensity: 0.4,
    migrationMultiplier: {
      UMUM: 1.0,
      LANGKA: 1.35,
      ENDEMIK_DILINDUNGI: 1.0,
    },
    gameplayTip: 'Gunakan pencahayaan strobo saat memotret kuadrat UPT dan perhatikan batas koridor 2,5m UVC.',
  },
  UPWELLING: {
    id: 'UPWELLING',
    name: 'Arus Upwelling',
    subtitle: 'Nutrisi Naik · Ikan Target Besar (Kerapu & Napoleon) Aktif',
    visibilityFactor: 0.84,
    currentForceX: -32,
    currentForceY: -8,
    coralHealthRatePerSec: 0.35,
    stormWaveIntensity: 0.3,
    migrationMultiplier: {
      UMUM: 0.9,
      LANGKA: 1.5,
      ENDEMIK_DILINDUNGI: 2.0,
    },
    gameplayTip: 'Saat terbaik mencatat biomassa Ikan Target ukuran besar (Napoleon, Kerapu Macan, Kakatua) pada sensus UVC!',
  },
  BADAI: {
    id: 'BADAI',
    name: 'Gelombang Badai',
    subtitle: 'Visibilitas 54% · Arus Deras & Risiko Patahan Karang (RB)',
    visibilityFactor: 0.54,
    currentForceX: 58,
    currentForceY: 14,
    coralHealthRatePerSec: -0.65,
    stormWaveIntensity: 0.92,
    migrationMultiplier: {
      UMUM: 0.65,
      LANGKA: 1.1,
      ENDEMIK_DILINDUNGI: 1.35,
    },
    gameplayTip: 'Jaga posisi di dekat garis transek! Gelombang badai dapat mematahkan karang bercabang (ACB) menjadi Rubble (RB).',
  },
};

export const WEATHER_CYCLE_ORDER: WeatherType[] = ['CERAH', 'HUJAN', 'UPWELLING', 'BADAI'];

export const COLLECTION_BADGES: CollectionBadge[] = [
  {
    id: 'first_discovery',
    title: 'Surveyor UVC Terverifikasi',
    description: 'Mencatat spesies ikan karang pertama ke dalam Lembar Kerja Sensus UVC.',
    requiredCount: 1,
    bonusScore: 150,
  },
  {
    id: 'seagrass_guardian',
    title: 'Spesialis Rataan & Lamun',
    description: 'Mendata seluruh spesies ikan karang di zona Padang Lamun & Rataan Karang.',
    requiredZone: 'LAMUN_BAKAU',
    bonusScore: 350,
  },
  {
    id: 'coral_taxonomist',
    title: 'Taksonom Ikan Terumbu Inti',
    description: 'Mendata seluruh spesies ikan Indikator, Target, dan Mayor di Terumbu Karang Inti.',
    requiredZone: 'TERUMBU_INTI',
    bonusScore: 400,
  },
  {
    id: 'megafauna_protector',
    title: 'Auditor Biomassa Ikan Target',
    description: 'Mengidentifikasi minimal 4 spesies Ikan Karang Langka / Dilindungi.',
    requiredRarity: 'ENDEMIK_DILINDUNGI',
    requiredCount: 4,
    bonusScore: 600,
  },
  {
    id: 'master_oceanographer',
    title: 'Peneliti Utama COREMAP Nusantara',
    description: 'Melengkapi seluruh 12 spesies ikan karang (Indikator, Target, Mayor) pada Sensus UVC.',
    requiredCount: 12,
    bonusScore: 1200,
  },
];

export function createInitialMissions(): MissionDefinition[] {
  return [
    {
      id: 1,
      title: 'Misi 1: Survei Transek PIT & Sensus Awal UVC',
      zoneFocus: 'Stasiun Transek 5m – 20m',
      briefing:
        'Bentangkan pita transek dan ambil sampel titik singgung karang (PIT), potret kuadrat (UPT), serta mulai sensus visual ikan karang (UVC) pada koridor 50×5m.',
      difficultyLabel: 'Protokol: Dasar (PIT + UVC)',
      weatherWarning: 'Cuaca Cerah Tropis mendukung kalibrasi identifikasi lifeform karang.',
      objectives: [
        { id: 'm1_trash', type: 'CLEAN_TRASH', label: 'Ambil Titik Transek PIT / Bersihkan Stasiun', target: 4, current: 0 },
        { id: 'm1_coral', type: 'TRANSPLANT_CORAL', label: 'Ukur Intersep LIT / Restorasi Stasiun Karang', target: 2, current: 0 },
        { id: 'm1_scan', type: 'SCAN_SPECIES', label: 'Sensus Spesies Ikan Karang (UVC)', target: 3, current: 0 },
      ],
      rewardPoints: 500,
      rewardTitle: 'Tabung Nitrox Riset Ilmiah',
      rewardUpgradeDesc: '+25 Kapasitas Oksigen Maksimum & +3 Kuota Restorasi/Sampel',
      upgradeEffect: {
        maxO2Bonus: 25,
        swimSpeedMultiplier: 1.0,
        scannerRangeBonus: 0,
        coralShieldBonus: 0,
      },
    },
    {
      id: 2,
      title: 'Misi 2: Pengukuran Intersep LIT & Katalog Lifeform',
      zoneFocus: 'Terumbu Karang Inti (Stasiun 20m – 35m)',
      briefing:
        'Lakukan pengukuran panjang koloni karang (LIT: ACB, ACT, CM, CF, CMR) dan perluas data sensus ikan Indikator (Chaetodontidae) serta Ikan Target.',
      difficultyLabel: 'Protokol: Menengah (LIT + UVC)',
      weatherWarning: 'Arus Upwelling memicu keluarnya ikan target ekonomis (Kerapu & Kakatua).',
      objectives: [
        { id: 'm2_coral', type: 'TRANSPLANT_CORAL', label: 'Catat Intersep Karang LIT / Restorasi Koloni', target: 4, current: 0 },
        { id: 'm2_trash', type: 'CLEAN_TRASH', label: 'Ambil Titik Sampel PIT & Bersihkan Substrat', target: 4, current: 0 },
        { id: 'm2_scan', type: 'SCAN_SPECIES', label: 'Total Spesies Ikan Tercatat di UVC', target: 6, current: 0 },
      ],
      rewardPoints: 800,
      rewardTitle: 'Kamera Kuadrat Strobo & Fin Riset',
      rewardUpgradeDesc: '+18% Kecepatan Renang & +35px Jangkauan Pengamatan UVC',
      upgradeEffect: {
        maxO2Bonus: 15,
        swimSpeedMultiplier: 1.18,
        scannerRangeBonus: 35,
        coralShieldBonus: 0,
      },
    },
    {
      id: 3,
      title: 'Misi 3: Kuadrat Foto UPT & Pengamanan Stasiun Permanen',
      zoneFocus: 'Lereng Terumbu (Stasiun 35m – 50m)',
      briefing:
        'Ambil data foto kuadrat 58×44 cm (UPT) di sepanjang transek, amankan stasiun dari jaring hantu yang menutupi karang, dan catat biomassa ikan karang.',
      difficultyLabel: 'Protokol: Lanjutan (UPT + UVC)',
      weatherWarning: 'Waspadai penurunan visibilitas saat Hujan Monsun dan Badai.',
      objectives: [
        { id: 'm3_illegal', type: 'STOP_ILLEGAL_GEAR', label: 'Potret Kuadrat UPT / Angkat Jaring di Transek', target: 4, current: 0 },
        { id: 'm3_coral', type: 'TRANSPLANT_CORAL', label: 'Verifikasi Koloni Karang Hidup (LIT/PIT)', target: 3, current: 0 },
        { id: 'm3_scan', type: 'SCAN_SPECIES', label: 'Total Spesies Ikan Tercatat di UVC', target: 9, current: 0 },
      ],
      rewardPoints: 1200,
      rewardTitle: 'Patok Permanen & Pelindung Stasiun Transek',
      rewardUpgradeDesc: 'Ketahanan Karang dari Gelombang Badai +50% & +20 Oksigen',
      upgradeEffect: {
        maxO2Bonus: 20,
        swimSpeedMultiplier: 1.05,
        scannerRangeBonus: 20,
        coralShieldBonus: 0.5,
      },
    },
    {
      id: 4,
      title: 'Misi 4: Publikasi Laporan Ilmiah Kesehatan Terumbu (Kepmen LH)',
      zoneFocus: 'Seluruh Bentangan Transek 50 Meter',
      briefing:
        'Selesaikan pengambilan data tutupan karang hidup hingga mencapai kategori "Sangat Baik" (>=75% HC) dan lengkapi sensus ikan karang UVC.',
      difficultyLabel: 'Protokol: Ekspedisi Komprehensif',
      weatherWarning: 'Pastikan seluruh stasiun transek terdata meski cuaca berubah dinamis.',
      objectives: [
        { id: 'm4_illegal', type: 'STOP_ILLEGAL_GEAR', label: 'Selesaikan Pemotretan Kuadrat UPT', target: 3, current: 0 },
        { id: 'm4_health', type: 'REACH_REEF_HEALTH', label: 'Capai Tutupan Karang Hidup / Kesehatan (%)', target: 80, current: 0 },
        { id: 'm4_scan', type: 'SCAN_SPECIES', label: 'Sensus Minimal 10 Spesies Ikan Karang', target: 10, current: 0 },
      ],
      rewardPoints: 2000,
      rewardTitle: 'Sertifikasi Peneliti Utama Ekosistem Terumbu Karang',
      rewardUpgradeDesc: 'Dataset Ilmiah PIT, LIT, UPT, dan UVC Tervalidasi!',
      upgradeEffect: {
        maxO2Bonus: 30,
        swimSpeedMultiplier: 1.1,
        scannerRangeBonus: 30,
        coralShieldBonus: 0.25,
      },
    },
  ];
}

// ============================================================================
// 4. SCIENTIFIC CALCULATIONS (PIT, LIT, UPT, UVC BIOMASS & KEPMEN LH STATUS)
// ============================================================================

/**
 * Classifies Reef Health Status according to official Indonesian Ministry of Environment standard
 * (Kepmen LH No. 4 Tahun 2001) based on Live Hard Coral Cover (% HC).
 */
export function classifyKepmenLhStatus(liveCoralCoverPct: number): {
  status: 'BURUK' | 'SEDANG' | 'BAIK' | 'SANGAT BAIK';
  color: string;
  rangeText: string;
} {
  if (liveCoralCoverPct >= 75) {
    return { status: 'SANGAT BAIK', color: '#00E5B8', rangeText: '75,0% – 100%' };
  }
  if (liveCoralCoverPct >= 50) {
    return { status: 'BAIK', color: '#38BDF8', rangeText: '50,0% – 74,9%' };
  }
  if (liveCoralCoverPct >= 25) {
    return { status: 'SEDANG', color: '#FACC15', rangeText: '25,0% – 49,9%' };
  }
  return { status: 'BURUK', color: '#EF4444', rangeText: '0,0% – 24,9%' };
}

/**
 * Calculates individual fish weight (grams) and biomass density (kg/ha) for a UVC belt transect
 * of 250 m² (50m x 5m) using the allometric Length-Weight relationship W = a * L^b.
 */
export function calculateFishBiomass(params: {
  lwA: number;
  lwB: number;
  lengthCm: number;
  countIndividuals: number;
  transectAreaM2?: number;
}): {
  singleWeightGrams: number;
  totalWeightGrams: number;
  biomassKgPerHa: number;
  abundanceIndPerHa: number;
} {
  const { lwA, lwB, lengthCm, countIndividuals, transectAreaM2 = 250 } = params;
  const singleWeightGrams = lwA * Math.pow(Math.max(1, lengthCm), lwB);
  const totalWeightGrams = singleWeightGrams * Math.max(0, countIndividuals);
  // Convert g / 250 m² to kg / ha (1 ha = 10,000 m², so multiply by 10000 / transectAreaM2 / 1000 = 40 / 1000)
  const areaToHectareMultiplier = 10000 / Math.max(1, transectAreaM2);
  const biomassKgPerHa = (totalWeightGrams / 1000) * areaToHectareMultiplier;
  const abundanceIndPerHa = countIndividuals * areaToHectareMultiplier;

  return {
    singleWeightGrams: Number(singleWeightGrams.toFixed(1)),
    totalWeightGrams: Number(totalWeightGrams.toFixed(1)),
    biomassKgPerHa: Number(biomassKgPerHa.toFixed(2)),
    abundanceIndPerHa: Math.round(abundanceIndPerHa),
  };
}

/**
 * Calculates scientific Coral Cover Percentage (% Hard Coral) across sampled transect stations
 * according to the active survey method (PIT, LIT, or UPT).
 */
export function calculateTransectCoralCover(
  stations: TransectStationRecord[],
  method: SurveyMethodType
): {
  sampledCount: number;
  totalStations: number;
  hardCoralPct: number;
  acroporaPct: number;
  nonAcroporaPct: number;
  abiotikDeadPct: number;
} {
  const sampled = stations.filter((s) => s.recordedLifeformCode !== null);
  if (sampled.length === 0) {
    return {
      sampledCount: 0,
      totalStations: stations.length,
      hardCoralPct: 0,
      acroporaPct: 0,
      nonAcroporaPct: 0,
      abiotikDeadPct: 0,
    };
  }

  const specMap = new Map(CORAL_LIFEFORMS.map((c) => [c.code, c]));

  if (method === 'LIT') {
    let totalCm = 0;
    let acroporaCm = 0;
    let nonAcroporaCm = 0;
    let deadCm = 0;
    for (const st of sampled) {
      const spec = specMap.get(st.recordedLifeformCode || st.trueLifeformCode);
      totalCm += st.totalSegmentCm;
      if (spec?.categoryGroup === 'ACROPORA') {
        acroporaCm += st.interceptLengthCm;
        deadCm += Math.max(0, st.totalSegmentCm - st.interceptLengthCm);
      } else if (spec?.categoryGroup === 'NON_ACROPORA') {
        nonAcroporaCm += st.interceptLengthCm;
        deadCm += Math.max(0, st.totalSegmentCm - st.interceptLengthCm);
      } else {
        deadCm += st.totalSegmentCm;
      }
    }
    const denom = Math.max(1, totalCm);
    const acroporaPct = (acroporaCm / denom) * 100;
    const nonAcroporaPct = (nonAcroporaCm / denom) * 100;
    const hardCoralPct = acroporaPct + nonAcroporaPct;
    const abiotikDeadPct = (deadCm / denom) * 100;
    return {
      sampledCount: sampled.length,
      totalStations: stations.length,
      hardCoralPct: Number(hardCoralPct.toFixed(1)),
      acroporaPct: Number(acroporaPct.toFixed(1)),
      nonAcroporaPct: Number(nonAcroporaPct.toFixed(1)),
      abiotikDeadPct: Number(abiotikDeadPct.toFixed(1)),
    };
  }

  if (method === 'UPT') {
    let totalPoints = 0;
    let acroporaPts = 0;
    let nonAcroporaPts = 0;
    let deadPts = 0;
    for (const st of sampled) {
      for (const code of st.uptPointCodes) {
        totalPoints++;
        const spec = specMap.get(code);
        if (spec?.categoryGroup === 'ACROPORA') acroporaPts++;
        else if (spec?.categoryGroup === 'NON_ACROPORA') nonAcroporaPts++;
        else deadPts++;
      }
    }
    const denom = Math.max(1, totalPoints);
    const acroporaPct = (acroporaPts / denom) * 100;
    const nonAcroporaPct = (nonAcroporaPts / denom) * 100;
    return {
      sampledCount: sampled.length,
      totalStations: stations.length,
      hardCoralPct: Number((acroporaPct + nonAcroporaPct).toFixed(1)),
      acroporaPct: Number(acroporaPct.toFixed(1)),
      nonAcroporaPct: Number(nonAcroporaPct.toFixed(1)),
      abiotikDeadPct: Number(((deadPts / denom) * 100).toFixed(1)),
    };
  }

  // Default PIT (Point Intercept Transect)
  let acroporaCount = 0;
  let nonAcroporaCount = 0;
  let deadCount = 0;
  for (const st of sampled) {
    const spec = specMap.get(st.recordedLifeformCode || st.trueLifeformCode);
    if (spec?.categoryGroup === 'ACROPORA') acroporaCount++;
    else if (spec?.categoryGroup === 'NON_ACROPORA') nonAcroporaCount++;
    else deadCount++;
  }
  const denom = sampled.length;
  const acroporaPct = (acroporaCount / denom) * 100;
  const nonAcroporaPct = (nonAcroporaCount / denom) * 100;
  return {
    sampledCount: sampled.length,
    totalStations: stations.length,
    hardCoralPct: Number((acroporaPct + nonAcroporaPct).toFixed(1)),
    acroporaPct: Number(acroporaPct.toFixed(1)),
    nonAcroporaPct: Number(nonAcroporaPct.toFixed(1)),
    abiotikDeadPct: Number(((deadCount / denom) * 100).toFixed(1)),
  };
}

export interface ScanEvaluationResult {
  isNewDiscovery: boolean;
  speciesPoints: number;
  newlyUnlockedBadges: CollectionBadge[];
  badgeBonusPoints: number;
  totalPointsAwarded: number;
}

export function evaluateSpeciesScan(
  speciesId: string,
  alreadyDiscoveredIds: ReadonlySet<string> | string[],
  alreadyUnlockedBadgeIds: ReadonlySet<string> | string[]
): ScanEvaluationResult {
  const discoveredSet = new Set(alreadyDiscoveredIds);
  const unlockedBadgeSet = new Set(alreadyUnlockedBadgeIds);
  const species = MARINE_SPECIES.find((s) => s.id === speciesId);

  if (!species) {
    return {
      isNewDiscovery: false,
      speciesPoints: 0,
      newlyUnlockedBadges: [],
      badgeBonusPoints: 0,
      totalPointsAwarded: 0,
    };
  }

  const isNewDiscovery = !discoveredSet.has(speciesId);
  if (!isNewDiscovery) {
    return {
      isNewDiscovery: false,
      speciesPoints: 25,
      newlyUnlockedBadges: [],
      badgeBonusPoints: 0,
      totalPointsAwarded: 25,
    };
  }

  discoveredSet.add(speciesId);
  const discoveredSpeciesList = MARINE_SPECIES.filter((s) => discoveredSet.has(s.id));

  const newlyUnlockedBadges: CollectionBadge[] = [];

  for (const badge of COLLECTION_BADGES) {
    if (unlockedBadgeSet.has(badge.id)) continue;

    let qualifies = false;
    if (badge.requiredZone) {
      const zoneSpecies = MARINE_SPECIES.filter((s) => s.zone === badge.requiredZone);
      qualifies = zoneSpecies.every((s) => discoveredSet.has(s.id));
    } else if (badge.requiredRarity && badge.requiredCount) {
      const rarityCount = discoveredSpeciesList.filter((s) => s.rarity === badge.requiredRarity).length;
      qualifies = rarityCount >= badge.requiredCount;
    } else if (badge.requiredCount) {
      qualifies = discoveredSet.size >= badge.requiredCount;
    }

    if (qualifies) {
      newlyUnlockedBadges.push(badge);
    }
  }

  const badgeBonusPoints = newlyUnlockedBadges.reduce((sum, b) => sum + b.bonusScore, 0);
  const totalPointsAwarded = species.pointsBonus + badgeBonusPoints;

  return {
    isNewDiscovery: true,
    speciesPoints: species.pointsBonus,
    newlyUnlockedBadges,
    badgeBonusPoints,
    totalPointsAwarded,
  };
}

export function updateMissionProgress(
  mission: MissionDefinition,
  event: {
    type: MissionObjective['type'];
    amount?: number;
    absoluteValue?: number;
  }
): { updatedMission: MissionDefinition; isCompleted: boolean } {
  const updatedObjectives = mission.objectives.map((obj) => {
    if (obj.type !== event.type) return obj;
    const nextVal =
      typeof event.absoluteValue === 'number'
        ? Math.min(obj.target, Math.max(obj.current, event.absoluteValue))
        : Math.min(obj.target, obj.current + (event.amount ?? 1));
    return {
      ...obj,
      current: nextVal,
    };
  });

  const isCompleted = updatedObjectives.every((obj) => obj.current >= obj.target);
  return {
    updatedMission: {
      ...mission,
      objectives: updatedObjectives,
    },
    isCompleted,
  };
}

export function calculateReefHealthIndex(params: {
  restoredCorals: number;
  totalCoralSockets: number;
  remainingTrash: number;
  remainingIllegalTraps: number;
  weatherHealthOffset: number;
}): number {
  const {
    restoredCorals,
    totalCoralSockets,
    remainingTrash,
    remainingIllegalTraps,
    weatherHealthOffset,
  } = params;

  const coralRatio = totalCoralSockets > 0 ? restoredCorals / totalCoralSockets : 1;
  const baseFromCorals = 48 + coralRatio * 42;
  const trashPenalty = remainingTrash * 1.4;
  const illegalTrapPenalty = remainingIllegalTraps * 2.2;
  const cleanBonus = remainingTrash === 0 && remainingIllegalTraps === 0 ? 10 : 0;

  const raw = baseFromCorals - trashPenalty - illegalTrapPenalty + cleanBonus + weatherHealthOffset;
  return Math.max(5, Math.min(100, Math.round(raw)));
}

export function computeWeatherEffects(
  weather: WeatherType,
  coralShieldBonus: number
): {
  visibilityRadiusPx: number;
  fogOpacity: number;
  currentDriftX: number;
  currentDriftY: number;
  effectiveCoralHealthRate: number;
} {
  const cfg = WEATHER_CONFIGS[weather];
  const clampedShield = Math.max(0, Math.min(0.85, coralShieldBonus));

  const effectiveCoralHealthRate =
    cfg.coralHealthRatePerSec < 0
      ? cfg.coralHealthRatePerSec * (1 - clampedShield)
      : cfg.coralHealthRatePerSec;

  const visibilityRadiusPx = Math.round(220 + cfg.visibilityFactor * 520);
  const fogOpacity = Number(((1 - cfg.visibilityFactor) * 0.72).toFixed(2));

  return {
    visibilityRadiusPx,
    fogOpacity,
    currentDriftX: cfg.currentForceX,
    currentDriftY: cfg.currentForceY,
    effectiveCoralHealthRate,
  };
}

export function getSpeciesMigrationWeight(species: MarineSpecies, weather: WeatherType): number {
  const cfg = WEATHER_CONFIGS[weather];
  const baseWeight = cfg.migrationMultiplier[species.rarity] ?? 1.0;
  const prefersCurrentWeather = species.preferredWeather.includes(weather);
  return Number((baseWeight * (prefersCurrentWeather ? 1.65 : 0.75)).toFixed(3));
}
