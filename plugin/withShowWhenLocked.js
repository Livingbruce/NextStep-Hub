const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withShowWhenLocked(config) {
  return withAndroidManifest(config, (c) => {
    const main = c.modResults.manifest.application[0].activity.find(
      (a) => a.$["android:name"] === ".MainActivity",
    );
    if (main) {
      main.$["android:showWhenLocked"] = "true";
      main.$["android:turnScreenOn"] = "true";
    }
    return c;
  });
};
