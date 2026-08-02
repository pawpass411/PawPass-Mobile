const fs = require("node:fs");
const path = require("node:path");

module.exports = ({ config }) => {
  const localGoogleServices = path.join(__dirname, "google-services.json");
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON
    || (fs.existsSync(localGoogleServices) ? localGoogleServices : undefined);

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
