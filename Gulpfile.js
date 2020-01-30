const async = require('async');
const gulp = require('gulp');
const iconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const svgSprite = require("gulp-svg-sprites");
 
gulp.task('iconfont', function(done){
	var iconStream = gulp.src(['source/svg/*.svg'])
		.pipe(iconfont({ 
			fontName: 'rage-icons',
			normalize: false,
			prependUnicode: true,
			startUnicode: 0xE001,
			//fontHeight: 530,
			formats: ['ttf', 'eot', 'woff','truetype','svg','woff2'],
			copyright: 'iAmStudio',
			centerHorizontally: false,
			ascent : 400,
			descent : 50,
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