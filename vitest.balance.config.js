// `npm run balance`: the measured pillars, slow, apart from `npm test`. Ten
// seeds, so "one seed in ten" can be read off them. One process, unisolated,
// so every file reads the one report measure.js keeps; its seeds run in
// workers of their own.
export default { test: { include: ['tests/*.balance.js'], env: { SEEDS: '10' }, hookTimeout: 30 * 60e3,
                         isolate: false, fileParallelism: false } };
