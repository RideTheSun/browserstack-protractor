var spawn = require('child_process').spawn;
var path = require('path');
var runningProcess = null;
var Emitter = require('events').EventEmitter;
var emitter = new Emitter();

function start(args, binaryFile) {

    console.log(args,binaryFile);
    runningProcess = spawn(binaryFile, args || []);

    runningProcess.stdout.on('data', function (data) {
        if (data.toString().indexOf('Press Ctrl-C to exit') > -1) {
            emitter.emit('browserstacklocal.running');
        }
        console.log(data.toString());
    });

    runningProcess.stderr.on('data', function (err) {
        console.log(err.toString());
    });

    process.on('SIGINT', function () {
        runningProcess.kill('SIGTERM');
    });

    process.on('uncaughtException', function () {
        runningProcess.kill('SIGTERM');
    });
}


function close() {
    if (runningProcess) {
        runningProcess.kill('SIGTERM');
        runningProcess = null;
    }
}


function run(args, platform) {
    if (!platform) {
        platform = process.platform;
    }

    if (!args) {
        args = process.argv;
        args = args.splice(2);
    }

    var architecture = process.arch.substring(1);

    var binaryPath = path.resolve(__dirname, '../node_modules/browserstacklocal');

    switch (platform) {

        case 'darwin':
            start(args, binaryPath + '/osx');
            break;

        case 'freebsd':
            start(args, binaryPath + '/linux' + architecture);
            break;

        case 'linux':
            start(args, binaryPath + '/linux' + architecture);
            break;

        case 'sunos':
            start(args, binaryPath + '/linux' + architecture);
            break;

        case 'win32':
            start(args, binaryPath + 'win.exe');
            break;

        default:
            throw new Error('Unsupported platform ' + platform + '.')

    }
}

module.exports = {
    run: run,
    close: close,
    runningProcess: runningProcess,
    emitter: emitter
};
