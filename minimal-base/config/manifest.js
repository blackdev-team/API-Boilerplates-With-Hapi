const envKey = require('./env');
const Path   = require('path');
const fs     = require('fs');

const manifest = {
  server: {
    debug: {request: [ 'error' ]},
    cache: {
      engine: require('catbox-redis'),
      name: 'cache',
      host: envKey('host'),
      port: envKey('redis_port')
    }
  },
  connections: [ {
    host: envKey('host'),
    port: envKey('port'),
    // add/generate self-signed SSL keys and uncomment for HTTPS:
    /* 
    tls: {
      key: fs.readFileSync('config/.keys/key.pem'),
      cert: fs.readFileSync('config/.keys/cert.pem')
      passphrase: process.env.CERT_PASSPHRASE // if needed for your cert
    }, 
    */
    routes: {
      cors: {
        origin: [ '*' ],
        additionalExposedHeaders: [
          'X-RateLimit-Limit',
          'X-RateLimit-Remaining',
          'X-RateLimit-Reset'
        ]
      },
      security: true
    },
    router: {stripTrailingSlash: true},
    labels: [ 'api' ]
  } ],
  registrations: [{
    plugin: {
      register: './plugins/redis',
      options: {
        partition: 'session',
        host: '127.0.0.1', // default
        port: 6379,        // default
        password: ''
      }
    }
  }, {
    plugin: {
      register: 'hapi-rate-limit',
      options: {
        userLimit: 500,
        userCache: {
          expiresIn: 1000 * 60 * 5 // 5 minutes
        },
        pathLimit: false,
        pathCache: {
          expiresIn: 1000 * 60 // 1 minute
        }
      }
    }
  }, {
    plugin: {
      register: 'hapi-auth-jwt2',
      options: {}
    }
  },{
    plugin: {
      register: './plugins/auth',
      options: {
        secret: envKey('jwt_secret')
      }
    }
  }, {
    plugin: {
      register: 'hapi-auth-google',
      options: {
        REDIRECT_URL: '/auth/google',
        config: {
          description: 'Google Auth Callback',
          notes: 'Handled by hapi-auth-google plugin',
          tags: ['api', 'auth', 'plugin']
        },
        handler: require('./../plugins/google-oauth'),
        scope: [
          'https://www.googleapis.com/auth/plus.profile.emails.read',
          'https://www.googleapis.com/auth/plus.login'
        ],
        BASE_URL:'http://' + envKey('host') + ':' + envKey('port')
      }
    }
  }, {
    plugin: './api/users',
    options: { routes: { prefix: '/api/users' }}
  }, {
    plugin: {
      register: 'good',
      options: {
        ops: false,
        reporters: {
          console: [{
            module: 'good-console'
          }, 'stdout']
        }
      }
    }
  }]
};

// hapi-auth-google can be registered only once, so if we have SSL connection, it's better to use it only
const sslConn = manifest.connections.find((conn) => conn.tls);
if (sslConn) {
  manifest.registrations.map((r) => {
    if (r.plugin.register === 'hapi-auth-google') {
      return r.plugin.options.BASE_URL = 'https://' + sslConn.host + ':' + sslConn.port;
    }
  });
}

// App Status Monitoring. Works with a signle connection only.
// Run 'npm install hapijs-status-monitor --save' before using
// if(manifest.connections.length === 1) {
//   manifest.registrations.push({
//     plugin: {
//       register: 'hapijs-status-monitor',
//       options: {
//         title: 'Example API Monitor',
//         connectionLabel: 'api'
//       }
//     }
//   });
// }

if (process.env.NODE_ENV !== 'production') {

  // blipp displays the route table on startup
  manifest.registrations.push({
    'plugin': {
      'register': 'blipp',
      'options': {}
    }
  });

  // Enable Swagger Documentation
  manifest.registrations.push({
    plugin: {
      register: './plugins/swagger',
      options: {
        info: {
          'title': 'API Documentation',
          'description': `(${process.env.NODE_ENV} environment)`,
          'version': require('./../package').version
        },
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      }
    }
  });
}

module.exports = manifest;
