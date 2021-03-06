'use strict';

require('dotenv').config({path: __dirname + '/.env'});

const envKey = key => {
  const env = process.env.NODE_ENV || 'development';

  const configuration = {
    host: process.env.HOST,
    port: process.env.PORT || 8080,
    jwt_secret: process.env.JWT_SECRET,
    jar_secret: process.env.JAR_SECRET,
    mongo_uri: process.env.MONGO_URI,
    redis_host: process.env.REDIS_HOST,
    redis_port: process.env.REDIS_PORT,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
    email_address: process.env.EMAIL_ADDRESS,
    email_password: process.env.EMAIL_PASSWORD
  };

  if (env === 'test') {
    configuration.mongo_uri = process.env.MONGO_URI_TEST;
  }

  return configuration[key];
};

module.exports = envKey;
