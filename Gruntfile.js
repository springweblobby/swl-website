module.exports = function(grunt){
	grunt.initConfig({
		browserify: {
			debug: {
				src: 'weblobby.jsx',
				dest: 'weblobby.bundle.js',
				options: { transform: ['reactify'] }
			},
		},
		sass: {
			debug: {
				files: [{
					expand: true,
					cwd: 'sass/',
					src: ['**/*.sass', '**/*.scss'],
					dest: 'css/',
					ext: '.css'
				}],
			},
		},
		watch: {
			browserify: {
				files: ['**/*.js', '**/*.jsx', '!*.bundle.js'],
				tasks: ['browserify:debug']
			},
			sass: {
				files: ['sass/**/*'],
				tasks: ['sass:debug']
			},
		},
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
};
