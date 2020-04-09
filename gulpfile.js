const async = require('async');
const gulp = require('gulp');
const gulpIconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const gulpPug = require('gulp-pug');
const plumber = require('gulp-plumber');
const argv = require('yargs').argv;
const svgSprite = require("gulp-svg-sprites");
const fs = require('fs');
const package = require('./package.json')

//Data
var buildPath = (argv.build === undefined) ? '' : 'dist/';
var fontsPath = 'fonts';
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
 
function iconfont(done){
	var iconStream = gulp.src(['svgs/*.svg'])
		.pipe(gulpIconfont({ 
			fontName: 'rage-icons',
			normalize: false,
			prependUnicode: true,
			startUnicode: 0xE001,
			fontHeight: font_data.options.font_size,
			formats: ['ttf', 'eot', 'woff','truetype','svg','woff2'],
			copyright: 'iAmStudio',
			centerHorizontally: false,
			ascent: font_data.options.ascent,
			descent: font_data.options.descent,
		}));
	async.parallel([
		function handleGlyphs(cb) {
			iconStream.on('glyphs', function(glyphs, options) {
				
				// Font sass
				gulp.src(['templates/font-rage.sass', 'templates/font-rage.scss'])
					.pipe(consolidate('lodash', {
						glyphs: glyphs,
						fontName: 'rage-icons',
						fontPath: '../fonts/',
						className: 'rage',
					}))
					.pipe(gulp.dest(`${buildPath}sass/`))
				// Font css
				gulp.src('templates/font-rage.css')
					.pipe(consolidate('lodash', {
						glyphs: glyphs,
						fontName: 'rage-icons',
						fontPath: '../fonts/',
						className: 'rage',
					}))
					.pipe(gulp.dest(`${buildPath}css/`))
					.on('finish', () => {
						
						console.log(glyphs, options);

						font_data.glyphs = glyphs;
						font_data.options.formats = options.formats;

						fs.writeFile(`${buildPath}font_data.json`, JSON.stringify(font_data), cb);
					});
			});
		},
		function handleFonts(cb) {
			iconStream
				.pipe(gulp.dest(`${buildPath}${fontsPath}`))
				.on('finish', cb);
		}
	], done);
};

function symbols() {
	return gulp.src('symbols/*.svg')
		.pipe(svgSprite({
			mode:'symbols',
			svgId: 'rage-%f',
			svg: {
				symbols: 'symbols.svg',
			},
			preview: false,
		}))
		.pipe(gulp.dest(`${buildPath}symbols`));
};

function build(cb){
	buildPath = 'dist';
	fontsPath = 'fonts';
	return gulp.series(iconfont, symbols);
	//cb();
}

exports.iconfont = iconfont;
exports.symbols = symbols;

exports.default = gulp.series(iconfont, symbols);

exports.build = build;