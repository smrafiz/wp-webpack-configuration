/**
 * This holds the configuration that is being used for both development and production.
 * This is being imported and extended in the config.development.js and config.production.js files
 *
 * @since 1.0.0
 */
const magicImporter = require('node-sass-magic-importer'); // Add magic import functionalities to SASS
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Extracts the CSS files into public/css
const BrowserSyncPlugin = require('browser-sync-webpack-plugin'); // Synchronising URLs, interactions and code changes across devices
const WebpackBar = require('webpackbar'); // Display elegant progress bar while building or watch
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin'); // To optimize (compress) all images using
const CopyPlugin = require('copy-webpack-plugin'); // For WordPress we need to copy images from src to public to optimize them
const RemovePlugin = require('remove-files-webpack-plugin');

module.exports = (projectOptions) => {
	/**
	 * CSS Rules
	 */
	const cssRules = {
		test:
			projectOptions.projectCss.use === 'sass'
				? projectOptions.projectCss.rules.sass.test
				: projectOptions.projectCss.rules.postcss.test,
		exclude: /(node_modules|bower_components|vendor)/,
		use: [
			MiniCssExtractPlugin.loader, // Creates `style` nodes from JS strings
			{
				loader: 'css-loader',
				options: { sourceMap: true, url: false },
			}, // Translates CSS into CommonJS
			{
				// loads the PostCSS loader
				loader: 'postcss-loader',
				options: require(projectOptions.projectCss.postCss)(
					projectOptions
				),
			},
		],
	};

	if (projectOptions.projectCss.use === 'sass') {
		// if chosen Sass then we're going to add the Sass loader
		cssRules.use.push({
			// Compiles Sass to CSS
			loader: 'sass-loader',
			options: {
				sassOptions: { importer: magicImporter() }, // add magic import functionalities to sass
				sourceMap: true,
			},
		});

	/**
	 * JavaScript rules
	 */
	const jsRules = {
		test: projectOptions.projectJs.rules.test,
		include: projectOptions.projectJsPath,
		exclude: /(node_modules|bower_components|vendor)/,
		use: 'babel-loader', // Configurations in "webpack/babel.config.js"
	};

	/**
	 * Images rules
	 */
	const imageRules = {
		test: projectOptions.projectImages.rules.test,
		use: [
			{
				loader: 'url-loader', // Or `url-loader` or your other loader
			},
		],
	};

	/**
	 * Optimization rules
	 */
	const optimizations = {};

	const removeJSFiles = [],
		removeMinJSFiles = [],
		removeMapJSFiles = [];

	Object.keys(projectOptions.projectCss.entry).forEach((files) => {
		removeJSFiles.push(files + '.js');
		removeMapJSFiles.push(files + '.js.map');
		removeMinJSFiles.push(files + '.min.js');
		removeMinJSFiles.push(files + '.min.js.map');
	});

	let removeFiles = [];
	removeFiles = removeJSFiles.concat(removeMinJSFiles, removeMapJSFiles);

	/**
	 * Plugins
	 */
	const plugins = [
		new WebpackBar({
			// Adds loading bar during builds
			reporters: ['profile'],
			profile: true,
		}),
		new MiniCssExtractPlugin({
			// Extracts CSS files
			filename: projectOptions.projectCss.filename,
		}),
		new CopyPlugin({
			// Copies images from src to public
			patterns: [
				{
					from: projectOptions.projectImagesPath,
					to: projectOptions.projectOutput + '/images',
				},
			],
		}),
		new ImageMinimizerPlugin({
			// Optimizes images
			minimizerOptions: projectOptions.projectImages.minimizerOptions,
		}),
		new RemovePlugin({
			/**
			 * After compilation permanently remove empty JS files created from CSS entries.
			 */
			after: {
				root: projectOptions.projectOutput + '/js',
				include: removeFiles,
			},
		}),
	];
	// Add browserSync to plugins if enabled
	if (projectOptions.browserSync.enable === true) {
		const browserSyncOptions = {
			files: projectOptions.browserSync.files,
			host: projectOptions.browserSync.host,
			port: projectOptions.browserSync.port,
		};
		if (projectOptions.browserSync.mode === 'server') {
			Object.assign(browserSyncOptions, {
				server: projectOptions.browserSync.server,
			});
		} else {
			Object.assign(browserSyncOptions, {
				proxy: projectOptions.browserSync.proxy,
			});
		}
		plugins.push(
			new BrowserSyncPlugin(browserSyncOptions, {
				reload: projectOptions.browserSync.reload,
				injectChanges: projectOptions.browserSync.injectCss,
				watchEvents: ['change', 'add', 'unlink', 'addDir', 'unlinkDir'],
				watch: true,
			})
		);
	}

	return {
		cssRules: cssRules,
		jsRules: jsRules,
		imageRules: imageRules,
		optimizations: optimizations,
		plugins: plugins,
	};
};
