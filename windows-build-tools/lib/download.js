'use strict';

var nugget = require('nugget');

var utils = require('./utils');

/**
 * Downloads the Visual Studio C++ Build Tools and Python installer to a temporary folder
 * at %USERPROFILE%\.windows-build-tools
 *
 * @returns {Promise} - Promise
 */
function download(cb) {
  downloadTools(utils.getBuildToolsInstallerPath()).then(function () {
    return downloadTools(utils.getPythonInstallerPath());
  }).then(function () {
    return cb();
  }).catch(function (error) {
    return utils.log(error);
  });
}

/**
 * Downloads specified file with a url from the installer.
 *
 * @param installer            - An object with fileName, directory, url,
 *                                  and destination path of the file to be downloaded
 * @returns {Promise.<string>} - Promise resolving with the path to the downloaded file
 */
function downloadTools(installer) {
  return new Promise(function (resolve, reject) {
    var nuggetOptions = {
      target: installer.fileName,
      dir: installer.directory,
      resume: process.env.npm_config_resume || true,
      verbose: true,
      strictSSL: process.env.npm_config_strict_ssl || false,
      proxy: process.env.npm_config_proxy || process.env.PROXY || undefined,
      sockets: process.env.npm_config_sockets || undefined
    };

    nugget(installer.url, nuggetOptions, function (errors) {
      if (errors) {
        // nugget returns an array of errors but we only need 1st because we only have 1 url
        var error = errors[0];

        if (error.message.indexOf('404') === -1) {
          return reject(error);
        } else {
          return reject('Could not find ' + installer.fileName + ' at ' + installer.url);
        }
      }

      utils.log('Downloaded ' + installer.fileName + '. Saved to ' + installer.path + '.');
      resolve(installer.path);
    });
  });
}

module.exports = download;