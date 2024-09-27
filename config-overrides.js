const TerserPlugin = require('terser-webpack-plugin');

module.exports = function override(config, env) {
  if (env === 'production') {
    config.optimization.minimizer = [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remover los console.log
          },
          output: {
            comments: false, // Remover comentarios
          },
          mangle: true, // Ofuscar variables
        },
      }),
    ];
  }
  return config;
};
