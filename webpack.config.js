const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const autoprefixer = require('autoprefixer');
const ip = require('ip').address();

const c = {
    v: '3',
    devMode: process.env.DEV === 'true',
    benchmark: false,
    analyzeBundles: false,
    isolatedMode: process.env.ISOLATED === 'true'
};

/**
 * @link https://link.medium.com/X9iilMtH2X
 * @return {webpack.DefinePlugin}
 */
const createEnvPlugin = env => {
    const envKeys = (() => {
        if (!env)
            return {};

        return Object.keys(env).reduce((prev, next) => {
            prev[`process.env.${next}`] = JSON.stringify(env[next]);

            return prev;
        }, {});
    })();

    return new webpack.DefinePlugin(envKeys);
};

const getCopiesForCopyWPPlugin = () => {
    const copiesArr = [
        {
            from: 'app/index.html'
        },
        {
            from: 'app/img/',
            to: 'img/[name].[ext]',
            toType: 'template'
        }];

    return copiesArr
};

const createPlugins = () => {
    const def = [
        createEnvPlugin(process.env),
        new MiniCssExtractPlugin({
            filename: 'styles.css',
        }),
        new CopyWebpackPlugin(getCopiesForCopyWPPlugin())
    ];

    // if (!c.devMode && c.isolatedMode)
    //     def.push(
    //         new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/])
    //     );

    if (!c.devMode)
        def.push(
            new OptimizeCssAssetsPlugin({
                assetNameRegExp: /\.css$/g,
                cssProcessor: require('cssnano'),
                cssProcessorPluginOptions: {
                    preset: ['default', {
                        discardComments: {
                            removeAll: true
                        }
                    }]
                },
                canPrint: true
            })
        );

    return def;
};

module.exports = {
    // mode: 'production',
    // mode: 'development',
    optimization: {
        minimize: !c.devMode
    },
    entry: [
        '@babel/polyfill',
        path.resolve(__dirname, 'app/index.js'),
        path.resolve(__dirname, 'app/scss/style.scss')
    ],
    performance: {
        maxEntrypointSize: 5120000000,
        maxAssetSize: 5120000000
    },
    resolve: {
        extensions: ['.js', '.json']
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    'presets': ['@babel/preset-env']
                }
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                autoprefixer({
                                    browsers: ['ie >= 11', 'last 25 version']
                                })
                            ],
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.(svg|png|jpg|)$/,
                loader: 'file-loader',
                options: {
                    name: 'img/[name].[ext]',
                    include: 'assets',
                    context: 'src',
                    toType: 'template'
                }
            }
        ]
    },
    plugins: createPlugins(),
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 3003,
        publicPath: '/',
        host: ip
    }
};