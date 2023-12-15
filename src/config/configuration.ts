export default () => ({
  flagsmithKey: process.env.FLAGSMITH_SERVER_SIDE_ENVIRONMENT_KEY || '',
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  featureFlag: process.env.FEATURE_FLAG || '',
});
