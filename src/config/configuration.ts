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
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretkey: process.env.MOMO_SECRETKEY || '',
    redirectHost: process.env.MOMO_REDIRECT_HOST || 'https://api.2all.com.vn',
    redirectUrl:
      process.env.MOMO_REDIRECT_URL || 'https://www.2all.com.vn/order/detail',
    requestType: process.env.MOMO_REQUEST_TYPE || 'captureWallet',
    baseUrl: process.env.MOMO_BASE_URL || 'https://test-payment.momo.vn',
    maximumRetry: process.env.MOMO_MAX_RETRIES || 1,
  },
  featureFlag: process.env.FEATURE_FLAG || '',
  ahamoveToken: process.env.AHAMOVE_TOKEN,
  planningDay: 7, // the restaurant will plan new cooking schedule every Saturday (last until the end of the day)
});
