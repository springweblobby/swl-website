/*
 * This stores data about games and maps. This is the only point of access to
 * unitsync. The possibility of fetching this data from plasma with unitsync
 * acting as a fallback should be investigated.
 *
 * TODO: This is a mock currently. It should be split into a mock for use with
 * browsers and the actual store that really accesses unitsync.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');

module.exports = Reflux.createStore({
	init: function(){
		_.extend(this, {
			games: {
				"Zero-K v1.2.9.9": {
					bots: {
						'CAI': { desc: 'AI that plays regular Zero-K' },
						'Chicken: Very Easy': { desc: 'For PvE in PvP games' },
						'Chicken: Easy': { desc: 'Ice cold' },
						'Chicken: Normal': { desc: 'Lukewarm' },
						'Chicken: Hard': { desc: 'Will burn your ass' },
						'Chicken: Suicidal': { desc: 'Flaming hell!' },
						'Chicken: Custom' : { desc: 'A chicken experience customizable using modoptions' },
						'Null AI': { desc: 'Empty AI for testing purposes' },
					},
				},
				"Evolution RTS - v8.04": {
					bots: {
						'Shard': { desc: 'Shard by AF' },
						'Survival Spawner: Very Easy': { desc: 'Beginner Games' },
						'Survival Spawner: Easy': { desc: 'Normal Games' },
						'Survival Spawner: Normal': { desc: 'Average Games' },
						'Survival Spawner: Hard': { desc: 'Large Games' },
						'Survival Spawner: Very Hard': { desc: 'Hardcore Games' },
						'Null AI': { desc: 'Empty AI for testing purposes' },
					},
				},
			},
			maps: {
				"SuperSpeedMetal": {
					minimap: 'http://api.springfiles.com/metadata/8f566ae85e32822ab0daf9fc840f5dd3.jpg',
				},
				"Titan-v2": {
					minimap: 'http://api.springfiles.com/metadata/73ba7491b1b477d83b50c34753db65fc.jpg',
				},
				"OnyxCauldron1.6": {
					minimap: 'http://api.springfiles.com/metadata/ceed5cc8dead21882324db17b44ac2f4.jpg',
				},
				"Comet Catcher Redux v2": {
					minimap: 'http://api.springfiles.com/metadata/efe211c518f2eabafa38117d7931de7d.jpg',
				},
			},
			engines: {
				"91.0": null,
				"96.0": null,
				"97.0.1-120-g3f35bbe": null,
				"97.0.1-135-gf161bef": null,
				"97.0.1-170-g313caff": null,
				"97.0.1-374-g21b3b68": null,
				"98.0": null,
			},
		});
	},
	getDefaultData: function(){
		return {
			games: this.games,
			maps: this.maps,
			engines: _.keys(this.engines),
		};
	},
});
