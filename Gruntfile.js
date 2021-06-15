module.exports = function(grunt) {
	"use strict";

	const metaBanner =  '/**\n' +
						' * Greeno WepApp - v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>\n' +
						' *\n' +
						' * Copyright (c) 2016 - <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
						' * Licensed under the <%= pkg.license %> license.\n' +
						' */\n';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			dist: ['dist']
		},
		concat: {
			dist: {
				options:{
					banner: "(function(){\n\"use strict\";",
					footer: "\n})();",
					process: function(src, filepath) {
					  return '// Source: ' + filepath + '\n' +
						src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
					}
				},
				files: {	
					'dist/assets/script.v<%= pkg.version %>.uncompressed.js': [
						'src/assets/js/progressbar.js',
						'src/assets/js/datagrid.js',
						'src/assets/js/resizable.js',
						'src/assets/js/main.js'
					],
					'dist/assets/polyfills.uncompressed.js': [
						'src/assets/js/*.polyfill.js'
					],
				}
			}
		},
		uglify: {
			dist: {
				options: {
					banner: metaBanner,
					mangle: {
						properties: {
							regex: /(elm|panels|store|getSize|getMinSize|getMaxSize|getHandleSize)/
						}
					}
				},
				files: {
					'dist/assets/script.v<%= pkg.version %>.js': ['dist/assets/script.v<%= pkg.version %>.uncompressed.js'],
					'dist/assets/polyfills.js': ['dist/assets/polyfills.uncompressed.js']
				}
			}
		},
		cssmin: {
			dist: {
				files: {
					'dist/assets/style.v<%= pkg.version %>.css':[
						'src/assets/css/bootstrap.reduced-iconset.css', 
						'src/assets/css/resizable.css',
						'src/assets/css/main.css'
					]
				}
			}
		},
		copy: {
			dist: {
				files: [{
					expand: true,
					src: ['**/*', '.*', '!**/assets/**'],
					cwd: 'src/',
					dest: 'dist/'
				},{
					expand: true,
					src: ['**'],
					cwd: 'src/assets/img/',
					dest: 'dist/assets/'
				},{
					expand: true,
					src: ['**'],
					cwd: 'src/assets/js/libs/',
					dest: 'dist/assets/'
				}]
			}
		},
		replace: {
			dist: {
				options: {
					patterns: [
						{
							match: /(?<="assets\/(?:script|style)\.v)[0-9\.]+(?=\.(?:js|css)")/g,
							replacement: '<%= pkg.version %>'
						}
					],
					usePrefix: false,
				},
				files: [{
					expand: true,
					src: ['src/index.php']
				}]
			}
		}
	});


	grunt.loadNpmTasks('grunt-replace');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');


	// Update version into files sources
	grunt.registerTask('update_ver', ['replace']);

	// Default task(s).
	grunt.registerTask('default', ['update_ver','clean', 'concat', 'uglify', 'cssmin', 'copy']);

};