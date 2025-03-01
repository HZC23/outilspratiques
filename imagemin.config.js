module.exports = {
    gifsicle: { optimizationLevel: 3, interlaced: true, colors: 256 },
    mozjpeg: { quality: 85, progressive: true },
    pngquant: { quality: [0.8, 0.9], speed: 4 },
    svgo: {
        plugins: [
            { removeViewBox: false },
            { cleanupIDs: true },
            { removeUselessStrokeAndFill: true }
        ]
    },
    webp: { quality: 85 }
}; 