'use strict';

const Glue = require('glue');
const Labbable = require('labbable');
const labbable = module.exports = new Labbable();
const manifest = require('./config/manifest');

Glue.compose(manifest, { relativeTo: __dirname }, (err, server) => {
  if (err) { throw err; } else {

    server.log(
      ['info', 'server'],
      `Installed plugins: ${Object.keys(server.plugins).join(', ')}`
    );

    // make the server 'testable' with lab.js
    labbable.using(server);

    server.initialize((initErr) => {
      if (initErr) { throw initErr; }

      // Don't continue to start server if module is being require()'d (likely in a test)
      if (module.parent) { return; }

      server.start((startErr) => {
        if (startErr) { throw startErr; }

        // Log to the console the host and port info
        server.connections.forEach(connection => {
          if (connection.info.protocol === 'https') {

            // redirect all http request to secure route
            server.ext('onRequest', function (request, reply) {
              if (request.headers['x-forwarded-proto'] !== 'https') {
                return reply('Forwarding to secure route')
                  .redirect('https://' + request.headers.host + request.path);
              }
              reply();
            });
          }

          server.log(
            ['info', 'server'],
            `server is listening on ${connection.info.uri} in ${process.env.NODE_ENV} mode`
          );
        });
      });
    });

  }
});
