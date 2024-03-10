export default () => ({
  flagsmithKey: process.env.FLAGSMITH_SERVER_SIDE_ENVIRONMENT_KEY || '',
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  momo: {
    partnerCode: '',
    accessKey: '',
    secretkey: '',
    redirectHost: 'https://c072-203-210-239-36.ngrok-free.app',
    redirectUrl: 'https://www.2all.com.vn/order/detail',
    requestType: 'captureWallet',
    baseUrl: 'https://test-payment.momo.vn',
    maximumRetry: 1,
  },
  featureFlag: process.env.FEATURE_FLAG || '',
  ahamoveToken: process.env.AHAMOVE_TOKEN,
  planningDay: 7, // the restaurant will plan new cooking schedule every Saturday (last until the end of the day)
});
