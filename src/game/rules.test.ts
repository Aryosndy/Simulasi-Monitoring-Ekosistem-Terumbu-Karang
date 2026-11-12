import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MARINE_SPECIES,
  CORAL_LIFEFORMS,
  SURVEY_METHODS_GUIDE,
  evaluateSpeciesScan,
  createInitialMissions,
  updateMissionProgress,
  calculateReefHealthIndex,
  computeWeatherEffects,
  getSpeciesMigrationWeight,
  calculateFishBiomass,
  calculateTransectCoralCover,
  classifyKepmenLhStatus,
  TransectStationRecord,
} from './rules';

test('species scan awards full points and first discovery badge on first scan', () => {
  const result = evaluateSpeciesScan('amphiprion_ocellaris', [], []);
  assert.equal(result.isNewDiscovery, true);
  assert.equal(result.speciesPoints, 140);
  assert.equal(result.newlyUnlockedBadges.length, 1);
  assert.equal(result.newlyUnlockedBadges[0].id, 'first_discovery');
  assert.equal(result.totalPointsAwarded, 140 + 150);
});

test('repeat species scan awards observation bonus and no duplicate badges', () => {
  const result = evaluateSpeciesScan('amphiprion_ocellaris', ['amphiprion_ocellaris'], ['first_discovery']);
  assert.equal(result.isNewDiscovery, false);
  assert.equal(result.totalPointsAwarded, 25);
  assert.equal(result.newlyUnlockedBadges.length, 0);
});

test('seagrass zone badge unlocks when all LAMUN_BAKAU reef fish are recorded', () => {
  const preDiscovered = ['chelmon_rostratus', 'siganus_vulpinus'];
  const result = evaluateSpeciesScan('amphiprion_ocellaris', preDiscovered, ['first_discovery']);
  assert.equal(result.isNewDiscovery, true);
  const badgeIds = result.newlyUnlockedBadges.map((b) => b.id);
  assert.ok(badgeIds.includes('seagrass_guardian'));
});

test('scientific PIT, LIT, and UPT transect coral cover calculations match formulas', () => {
  const sampleStations: TransectStationRecord[] = [
    {
      stationId: 1,
      meterMark: 5,
      trueLifeformCode: 'ACB',
      recordedLifeformCode: 'ACB',
      interceptLengthCm: 400,
      totalSegmentCm: 500,
      uptPointCodes: ['ACB', 'ACB', 'ACT', 'CM', 'DCA'],
      sampledByMethods: ['PIT', 'LIT', 'UPT'],
      isClassificationAccurate: true,
    },
    {
      stationId: 2,
      meterMark: 10,
      trueLifeformCode: 'CM',
      recordedLifeformCode: 'CM',
      interceptLengthCm: 350,
      totalSegmentCm: 500,
      uptPointCodes: ['CM', 'CM', 'CF', 'DCA', 'DCA'],
      sampledByMethods: ['PIT', 'LIT', 'UPT'],
      isClassificationAccurate: true,
    },
    {
      stationId: 3,
      meterMark: 15,
      trueLifeformCode: 'DCA',
      recordedLifeformCode: 'DCA',
      interceptLengthCm: 0,
      totalSegmentCm: 500,
      uptPointCodes: ['DCA', 'DCA', 'DCA', 'SC', 'CM'],
      sampledByMethods: ['PIT', 'LIT', 'UPT'],
      isClassificationAccurate: true,
    },
  ];

  // PIT: 2 out of 3 stations are Hard Coral (ACB, CM) -> 66.7%
  const pitRes = calculateTransectCoralCover(sampleStations, 'PIT');
  assert.equal(pitRes.hardCoralPct, 66.7);
  assert.equal(pitRes.acroporaPct, 33.3);
  assert.equal(pitRes.nonAcroporaPct, 33.3);

  // LIT: (400 + 350) / 1500 cm = 50.0%
  const litRes = calculateTransectCoralCover(sampleStations, 'LIT');
  assert.equal(litRes.hardCoralPct, 50.0);

  // UPT: 8 out of 15 grid points are Hard Coral -> 53.3%
  const uptRes = calculateTransectCoralCover(sampleStations, 'UPT');
  assert.equal(uptRes.hardCoralPct, 53.3);
});

test('Kepmen LH No. 4/2001 classification categorizes coral cover accurately', () => {
  assert.equal(classifyKepmenLhStatus(18.5).status, 'BURUK');
  assert.equal(classifyKepmenLhStatus(38.0).status, 'SEDANG');
  assert.equal(classifyKepmenLhStatus(62.4).status, 'BAIK');
  assert.equal(classifyKepmenLhStatus(81.0).status, 'SANGAT BAIK');
});

test('UVC allometric fish biomass calculation W = a * L^b works accurately', () => {
  const bio = calculateFishBiomass({
    lwA: 0.02,
    lwB: 3.0,
    lengthCm: 20,
    countIndividuals: 5,
    transectAreaM2: 250,
  });
  // single weight = 0.02 * 8000 = 160g; 5 fish = 800g = 0.8kg per 250m2 -> * 40 = 32 kg/ha
  assert.equal(bio.singleWeightGrams, 160);
  assert.equal(bio.totalWeightGrams, 800);
  assert.equal(bio.biomassKgPerHa, 32);
  assert.equal(bio.abundanceIndPerHa, 200);
});

test('catalogs contain all 4 survey methods, coral lifeforms, and 3 UVC fish groups', () => {
  assert.equal(Object.keys(SURVEY_METHODS_GUIDE).length, 4);
  assert.ok(CORAL_LIFEFORMS.length >= 8);
  const groups = new Set(MARINE_SPECIES.map((s) => s.functionalGroup));
  assert.ok(groups.has('INDIKATOR'));
  assert.ok(groups.has('TARGET'));
  assert.ok(groups.has('MAYOR'));
});

test('mission progress and dynamic weather calculations work accurately', () => {
  const missions = createInitialMissions();
  const step1 = updateMissionProgress(missions[0], { type: 'CLEAN_TRASH', amount: 4 });
  const step2 = updateMissionProgress(step1.updatedMission, { type: 'TRANSPLANT_CORAL', amount: 2 });
  const step3 = updateMissionProgress(step2.updatedMission, { type: 'SCAN_SPECIES', absoluteValue: 3 });
  assert.equal(step3.isCompleted, true);

  const health = calculateReefHealthIndex({
    restoredCorals: 10,
    totalCoralSockets: 10,
    remainingTrash: 0,
    remainingIllegalTraps: 0,
    weatherHealthOffset: 0,
  });
  assert.equal(health, 100);

  const stormFx = computeWeatherEffects('BADAI', 0.5);
  assert.ok(stormFx.visibilityRadiusPx < 600);

  const napoleon = MARINE_SPECIES.find((s) => s.id === 'cheilinus_undulatus')!;
  assert.ok(getSpeciesMigrationWeight(napoleon, 'UPWELLING') > 1.5);
});
