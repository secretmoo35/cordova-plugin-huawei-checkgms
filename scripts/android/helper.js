var fs = require("fs");
var path = require("path");

function rootBuildGradleExists() {
  var target = path.join("platforms", "android", "build.gradle");
  return fs.existsSync(target);
}

/*
 * Helper function to read the build.gradle that sits at the root of the project * more then cordova android 9.1 user "repositories.gradle"
 */
function readRootBuildRepositoriesGradle() {
  var target = path.join("platforms", "android", "repositories.gradle");
  return fs.readFileSync(target, "utf-8");
}

/*
 * Helper function to read the build.gradle that sits at the root of the project
 */
function readRootBuildGradle() {
  var target = path.join("platforms", "android", "build.gradle");
  return fs.readFileSync(target, "utf-8");
}

/*
 * Added a dependency on 'com.google.gms' based on the position of the know 'com.android.tools.build' dependency in the build.gradle
 */
function addDependencies(buildGradle) {
  // find the known line to match
  var match = buildGradle.match(
    /^(\s*)classpath "com.android.tools.build(.*)/m
  );
  var whitespace = match[1];

  // modify the line to add the necessary dependencies
  var agcDependency =
    whitespace + "classpath 'com.huawei.agconnect:agcp:1.5.2.300'";

  var modifiedLine = match[0] + "\n" + agcDependency;

  // modify the actual line
  return buildGradle.replace(
    /^(\s*)classpath "com.android.tools.build(.*)/m,
    modifiedLine
  );
}

/*
 * Add 'google()' and Crashlytics to the repository repo list
 */
function addRepos(buildGradle) {
  // find the known line to match
  var match = buildGradle.match(/^(\s*)mavenCentral\(\)/m);
  var whitespace = match[1];

  // modify the line to add the necessary repo
  var huaweiMavenRepo =
    whitespace + "maven { url 'https://developer.huawei.com/repo/' }";
  var modifiedLine = match[0] + "\n" + huaweiMavenRepo;

  // modify the actual line
  buildGradle = buildGradle.replace(/^(\s*)jcenter\(\)/m, modifiedLine);

  // update the all projects grouping
  var allProjectsIndex = buildGradle.indexOf("allprojects");
  if (allProjectsIndex > 0) {
    // split the string on allprojects because jcenter is in both groups and we need to modify the 2nd instance
    var firstHalfOfFile = buildGradle.substring(0, allProjectsIndex);
    var secondHalfOfFile = buildGradle.substring(allProjectsIndex);

    // Add google() to the allprojects section of the string
    match = secondHalfOfFile.match(/^(\s*)jcenter\(\)/m);
    var huaweiMavenRepo =
      whitespace + "maven { url 'https://developer.huawei.com/repo/' }";
    modifiedLine = match[0] + "\n" + huaweiMavenRepo;
    // modify the part of the string that is after 'allprojects'
    secondHalfOfFile = secondHalfOfFile.replace(
      /^(\s*)jcenter\(\)/m,
      modifiedLine
    );

    // recombine the modified line
    buildGradle = firstHalfOfFile + secondHalfOfFile;
  }
  return buildGradle;
}

/*
 * Helper function to write to the build.gradle that sits at the root of the project
 */
function writeRootBuildRepositoriesGradle(contents) {
  var target = path.join("platforms", "android", "repositories.gradle");
  fs.writeFileSync(target, contents);
}
/*
 * Helper function to write to the build.gradle that sits at the root of the project
 */
function writeRootBuildGradle(contents) {
  var target = path.join("platforms", "android", "build.gradle");
  fs.writeFileSync(target, contents);
}

module.exports = {
  modifyRootBuildGradle: function () {
    // be defensive and don't crash if the file doesn't exist
    if (!rootBuildGradleExists) {
      return;
    }

    var buildGradle = readRootBuildGradle();
    var repositoriesGradle = readRootBuildRepositoriesGradle();
    // Add Google Play Services Dependency
    buildGradle = addDependencies(buildGradle);

    // Add Google's Maven Repo
    repositoriesGradle = addRepos(repositoriesGradle);

    writeRootBuildGradle(buildGradle);
    writeRootBuildRepositoriesGradle(repositoriesGradle);
  },

  restoreRootBuildGradle: function () {
    // be defensive and don't crash if the file doesn't exist
    if (!rootBuildGradleExists) {
      return;
    }

    var buildGradle = readRootBuildGradle();

    // remove any lines we added
    buildGradle = buildGradle.replace(
      /(?:^|\r?\n)(.*)com.huawei.cordovahmsgmscheckplugin*?(?=$|\r?\n)/g,
      ""
    );

    writeRootBuildGradle(buildGradle);
  },
};
