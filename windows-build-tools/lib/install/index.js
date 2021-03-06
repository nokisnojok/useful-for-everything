'use strict';

var fs = require('fs-extra');
var path = require('path');
var spawn = require('child_process').spawn;
var debug = require('debug')('windows-build-tools');
var chalk = require('chalk');
var Spinner = require('cli-spinner').Spinner;

var launchInstaller = require('./launch');
var Tailer = require('./tailer');
var utils = require('../utils');

var spinner = void 0;

/**
 * Installs the build tools, tailing the installation log file
 * to understand what's happening
 *
 * @returns {Promise.<Object>} - Promise that resolves with the installation result
 */

function install(cb) {
  utils.log(chalk.green('Starting installation...'));

  launchInstaller().then(function () {
    return launchSpinner();
  }).then(function () {
    return Promise.all([installBuildTools(), installPython()]);
  }).then(function (paths) {
    stopSpinner();

    var variables = {
      buildTools: paths[0],
      python: paths[1]
    };
    cb(variables);
  }).catch(function (error) {
    stopSpinner();

    utils.log(error);
  });
}

function stopSpinner() {
  if (spinner) {
    spinner.stop(false);
  }
}

function launchSpinner() {
  utils.log('Launched installers, now waiting for them to finish.');
  utils.log('This will likely take some time - please be patient!');

  spinner = new Spinner('Waiting for installers... %s');
  spinner.setSpinnerDelay(180);
  spinner.start();
}

function installBuildTools() {
  return new Promise(function (resolve, reject) {
    var tailer = new Tailer(utils.getBuildToolsInstallerPath().logPath);

    tailer.on('exit', function (result, details) {
      debug('build tools tailer exited');
      if (result === 'error') {
        debug('Installer: Tailer found error with installer', details);
        reject(err);
      }

      if (result === 'success') {
        utils.log(chalk.bold.green('Successfully installed Visual Studio Build Tools.'));
        debug('Installer: Successfully installed Visual Studio Build Tools according to tailer');
        resolve();
      }

      if (result === 'failure') {
        utils.log(chalk.bold.red('Could not install Visual Studio Build Tools.'));
        utils.log('Please find more details in the log files, which can be found at');
        utils.log(utils.getWorkDirectory());
        debug('Installer: Failed to install according to tailer');
        resolve();
      }
    });

    tailer.start();
  });
}

function installPython() {
  return new Promise(function (resolve, reject) {
    // The log file for msiexe is utf-16
    var tailer = new Tailer(utils.getPythonInstallerPath().logPath, 'ucs2');

    tailer.on('exit', function (result, details) {
      debug('python tailer exited');
      if (result === 'error') {
        debug('Installer: Tailer found error with installer', details);
        reject(err);
      }

      if (result === 'success') {
        utils.log(chalk.bold.green('Successfully installed Python 2.7'));
        debug('Installer: Successfully installed Python 2.7 according to tailer');

        var variables = {
          pythonPath: details || utils.getPythonInstallerPath().targetPath
        };
        resolve(variables);
      }

      if (result === 'failure') {
        utils.log(chalk.bold.red('Could not install Python 2.7.'));
        utils.log('Please find more details in the log files, which can be found at');
        utils.log(utils.getWorkDirectory());
        debug('Installer: Failed to install Python 2.7 according to tailer');
        resolve(undefined);
      }
    });

    tailer.start();
  });
}

module.exports = install;