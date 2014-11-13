module.exports = function(grunt){
	grunt.initConfig({
		browserify: {
			debug: {
				src: 'weblobby.jsx',
				dest: 'weblobby.bundle.js',
				options: {
					transform: ['reactify'],
					browserifyOptions: { debug: true }
				}
			},
			release: {
				src: 'weblobby.jsx',
				dest: 'weblobby.bundle.js',
				options: {
					transform: ['reactify', 'uglifyify'],
				}
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
			release: {
				files: [{
					expand: true,
					cwd: 'sass/',
					src: ['**/*.sass', '**/*.scss'],
					dest: 'css/',
					ext: '.css'
				}],
				options: {
					style: 'compressed',
					sourcemap: 'none'
				}
			},
		},
		watch: {
			browserify: {
				files: ['**/*.js', '**/*.jsx', '!*.bundle.js', '!node_modules/**'],
				tasks: ['browserify:debug']
			},
			sass: {
				files: ['sass/**/*'],
				tasks: ['sass:debug']
			},
		},
		uglify: {
			uglify: {
				files: {
					'weblobby.bundle.js': ['weblobby.bundle.js']
				}
			}
		},
	});

	grunt.registerTask('release', ['browserify:release', 'sass:release', 'uglify']);
	grunt.registerTask('debug', ['browserify:debug', 'sass:debug']);
	grunt.registerTask('default', 'Help', function(){
		grunt.log.write("\n\nUSAGE\n\n" +
			"Use 'grunt watch' to have grunt rebuild the poject in debug mode whenever something changes.\n" +
			"You can also use 'grunt debug' to build in debug mode explicitly.\n" +
			"Run 'grunt release' to build in release mode.\n\n");
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
};
