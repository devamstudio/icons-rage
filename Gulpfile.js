const async = require('async');
const gulp = require('gulp');
const iconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const svgSprite = require("gulp-svg-sprites");
const fs = require('fs');
const package = require('./package.json')

//Data
var font_data = {
	title: 'Rage Iconfont',
	name: package.name,
	version: package.version,
	prefix: 'rage-',
	options: {
		ascent: 550,
		descent: 50,
		font_size: 600,
		formats: []
	},
	glyphs: {}
}
 
gulp.task('iconfont', function(done){
	var iconStream = gulp.src(['source/svg/*.svg'])
		.pipe(iconfont({ 
			fontName: 'rage-icons',
			normalize: false,
			prependUnicode: true,
			startUnicode: 0xE001,
			fontHeight: font_data.options.font_size,
			formats: ['ttf', 'eot', 'woff','truetype','svg','woff2'],
			copyright: 'iAmStudio',
			centerHorizontally: false,
			ascent : font_data.options.ascent,
			descent : font_data.options.descent,
		}));
	async.parallel([
		function handleGlyphs(cb) {
			iconStream.on('glyphs', function(glyphs, options) {
				// Font css
				gulp.src('source/templates/font-rage.css')
					.pipe(consolidate('lodash', {
						glyphs: glyphs,
						fontName: 'rage-icons',
						fontPath: '../fonts/',
						className: 'rage',
					}))
					.pipe(gulp.dest('dist/css/'))
					.on('finish', cb);
				console.log(glyphs, options);

				font_data.glyphs = glyphs;
				font_data.options.formats = options.formats;

				fs.writeFile('dist/font_data.json', JSON.stringify(font_data), cb);
			});
		},
		function handleFonts(cb) {
			iconStream
				.pipe(gulp.dest('dist/fonts/'))
				.on('finish', cb);
		}
	], done);
});

gulp.task('symbols', function () {
	gulp.src('source/symbols/*.svg')
		.pipe(svgSprite({
			mode:'symbols',
			svgId: 'rage-%f',
			preview: false,
		}))
		.pipe(gulp.dest('dist/'));
});

gulp.task('pug', function buildHTML() {
	gulp.src('source/test/index.pug')
		.pipe( plumber() )
		.pipe( pug({ pretty: true }) )
		.pipe( gulp.dest( 'test/' ) );
});