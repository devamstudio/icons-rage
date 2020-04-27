const async = require('async');
const gulp = require('gulp');
const gulpIconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var sass_globbing = require('gulp-sass-glob');
const argv = require('yargs').argv;
const svgSprite = require("gulp-svg-sprites");
const fs = require('fs');
const package = require('./package.json');
var server = require("browser-sync").create();

//Data
var buildPath = (argv.build === undefined) ? '' : 'dist/';
var fontsPath = 'fonts';
var font_data = JSON.parse(fs.readFileSync('./font_data.json')) ? JSON.parse(fs.readFileSync('./font_data.json')) : {
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
						
						glyphs.forEach(function(raw_item) {
							let founded = font_data.glyphs.filter((source_item) => {
								return source_item.name == raw_item.name;
							});
							if(founded[0]){
								founded[0].categories = founded[0].categories ? founded[0].categories : ['all'];
								founded[0].keywords = founded[0].keywords ? founded[0].keywords : [];
								founded[0].name = raw_item.name;
								founded[0].unicode = raw_item.unicode;
							} else {
								raw_item.categories = ['all'];
								raw_item.keywords = [];
								font_data.glyphs.push(raw_item);
							}
						})
						font_data.options.formats = options.formats;

						fs.writeFile(`${buildPath}font_data.json`, JSON.stringify(font_data, null, 4), cb);
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

function docsMarkup(){
	return gulp.src('docs/**/*.html')
		.pipe(gulp.dest(`${buildPath}`));
};

function docsStyles(){
	return gulp.src('docs//sass/*.sass')
		.pipe(sass_globbing())
		.pipe(sass({outputStyle: 'compressed' }))
		.pipe(gulp.dest(`${buildPath}css/`));
};


function serve() {
	server.init({
		server: "dist/",
		notify: false,
		open: true,
		cors: true,
		ui: false
	});

	gulp.watch(['./docs/**/*.html'], docsMarkup);
	gulp.watch(['./docs/**/*.sass'], docsStyles);
	gulp.watch(['./svgs/*.svg'], iconfont);
	gulp.watch("source/*.html").on("change", server.reload);
};



exports.iconfont = iconfont;
exports.symbols = symbols;
exports.docsMarkup = docsMarkup;
exports.docsStyles = docsStyles;
exports.serve = serve;

exports.default = gulp.series(iconfont, symbols, docsMarkup, docsStyles);
exports.dev = gulp.series(iconfont, symbols, docsMarkup, docsStyles, serve);