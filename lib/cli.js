/**
 * The command line interface for interacting with the browserstack-protractor runner.
 * It takes care of parsing command line options.
 */
'use strict';

var args = [];

process.argv.slice(2).forEach(function (arg) {
    var flag = arg.split('=')[0];

    switch (flag) {
        case 'debug':
            args.push('--nodeDebug');
            args.push('true');
            break;
        case '-d':
        case '--debug':
        case '--debug-brk':
            args.push('--v8Debug');
            args.push('true');
            break;
        default:
            args.push(arg);
            break;
    }
});

var util = require('util');
var fs = require('fs');
var path = require('path');
var child = require('child_process');
var optimist = require('optimist').
    usage('Usage: protractor [configFileBrowserStack] [configFileProtractor]').
    describe('help', 'Print Browserstack-Protractor help menu').
    describe('version', 'Print Browserstack-Protractor version').
    check(function (arg) {
        if (arg._.length > 2) {
            throw 'Error: more than one config file for browserstack and protractor specified';
        }
    });
var argv = optimist.parse(args);
if (argv.version) {
    util.puts('Version ' + require(path.join(__dirname, '../package.json')).version);
    process.exit(0);
}

var configFileProtractor = argv._[1];
if (!configFileProtractor) {
    if (fs.existsSync('./protractor.conf.js')) {
        configFileProtractor = './protractor.conf.js';
    }
}
if (!configFileProtractor && args.length < 3) {
    optimist.showHelp();
    process.exit(1);
}
var browserStackLocal = require('./browser-stack-local');
var spawn = require('child_process').spawn;
browserStackLocal.emitter.on('browserstacklocal.running', function () {
    var binaryPath = path.resolve(__dirname, '../node_modules/.bin/protractor');

    var protractor = spawn(binaryPath, [argv._[1]]);

    protractor.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    protractor.stderr.on('data', function (err) {
        console.log(err.toString());
        browserStackLocal.close();
    });

    protractor.on('close', function () {
        browserStackLocal.close();
    });

    process.on('SIGINT', function () {
        protractor.kill('SIGTERM');
    });

    process.on('uncaughtException', function () {
        protractor.kill('SIGTERM');
    });

});

var nconf = require('nconf');
nconf.env().file(argv._[0]);

browserStackLocal.run([nconf.get('BROWSERSTACK_KEY'), nconf.get('BROWSERSTACK_HOST') + ',' + nconf.get('BROWSERSTACK_PORT') + ',' + nconf.get('BROWSERSTACK_SSL_FLAG')]);
