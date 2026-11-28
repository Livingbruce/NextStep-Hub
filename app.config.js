import appJson from "./app.json";

const expo = appJson.expo;

export default {
  ...expo,

  android: {
    ...expo.android,

    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
  },
};
