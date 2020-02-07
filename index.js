#!/usr/bin/env node

global.WebSocket = require('ws');

const fetch = require('node-fetch');
const fs = require('fs');
const crosis = require('@replit/crosis');
const TextDecoder = require('text-encoder-lite').TextDecoderLite;
const TextEncoder = require('text-encoder-lite').TextEncoderLite;
const AdmZip = require('adm-zip');
const readline = require('readline-sync');

function getToken(replId, apiKey) {
    return fetch(`https://repl.it/api/v0/repls/${replId}/token`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
    }).then(res => res.json());
}

function getJSON(user, repl) {
    return fetch(`https://repl.it/data/repls/@${user}/${repl}`, {
        method: 'GET'
    }).then(res => res.json());
}

async function connect(user, repl, apiKey) {
    const json = await getJSON(user, repl);
    const replID = json.id;

	const client = new crosis.Client();

	const token = await getToken(replID, apiKey);
	await client.connect({ token });

	return client;
}

async function readFile(client, path) {
    const files = client.openChannel({ service: 'files' });
    const decoder = new TextDecoder();
    const data = await files.request({ read: { path: path }});
    files.close();
    return decoder.decode(data.file.content)
}

async function writeFile(client, path, data) {
    const files = client.openChannel({ service: 'gcsfiles' });
    const encoder = new TextEncoder();
    const out = await files.request({ write: { path: path, content: encoder.encode(data) }});
    files.close();
    console.log('Output:', out);
    return out;
}

async function download(url, path) {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on('error', (err) => {
                reject(err);
            });
        fileStream.on('finish', function() {
            resolve();
        });
    });
}

async function start() {
    var argv = process.argv.slice(3);
    var files = [];
    const command = process.argv[2];
    if (command == 'info') {
        if (argv.length < 1) {
            console.log('Error: no repl to read info from');
            process.exit(1);
        }
        var user = argv[0].split('/')[0];
        var repl = argv[0].split('/')[1];
        const json = await getJSON(user, repl);
        console.log('ID:', json.id);
        console.log('URL:', `https://repl.it${json.url}`);
        console.log('Created:', json.time_created);
        console.log('Files:');
        json.fileNames.forEach(function (file) {
            console.log(`\t${file}`);
        });
    } else if (command == 'init') {
        if (argv.length < 1) {
            console.log('Error: no API key provided');
            process.exit(1);
        }
        fs.mkdir('.repl', function (err) {
            if (err) throw err;
        });
        fs.writeFileSync('.repl/files', JSON.stringify(files));
        fs.writeFileSync('.repl/key', argv[0])
    } else if (command == 'push') {
        if (argv.length < 1) {
            console.log('Error: no repl to push to');
            process.exit(1);
        }
        var user = argv[0].split('/')[0];
        var repl = argv[0].split('/')[1];
        const decoder = new TextDecoder();
        const key = decoder.decode(fs.readFileSync('.repl/key'));
        const client = await connect(user, repl, key);
        files = JSON.parse(fs.readFileSync('.repl/files'));

        var i;
        for (i = 0; i < files.length; i++) {
            var file = files[i];
            const data = fs.readFileSync(file);
            const decoder = new TextDecoder();
            await writeFile(client, file, decoder.decode(data));
        }

        client.close();
    } else if (command == 'pull') {
        if (argv.length < 1) {
            console.log('Error: no repl to pull from');
            process.exit(1);
        }
        var user = argv[0].split('/')[0];
        var repl = argv[0].split('/')[1];
        fs.mkdir(repl, function (err) {
            if (err) throw err;
        });
        await download(`https://repl.it/@${user}/${repl}.zip`, `${repl}/${repl}.zip`);
        var zip = new AdmZip(`${repl}/${repl}.zip`);
        zip.extractAllTo(repl, true);
        fs.unlink(`${repl}/${repl}.zip`);
    } else if (command == 'add') {
        if (argv.length < 1) {
            console.log('No file to add');
            process.exit(1);
        }
        files = JSON.parse(fs.readFileSync('.repl/files'));
        files.push(argv[0]);
        fs.writeFileSync('.repl/files', JSON.stringify(files));
    } else if (command == 'status') {
        files = JSON.parse(fs.readFileSync('.repl/files'));
        files.forEach(function (file) {
            console.log(`ADDED ${file}`)
        });
    } else if (command == 'clear') {
        files = [];
        fs.writeFileSync('.repl/files', JSON.stringify(files));
    } else if (command == 'run') {
        if (argv.length < 1) {
            console.log('Error: no repl to run');
            process.exit(1);
        }
        var user = argv[0].split('/')[0];
        var repl = argv[0].split('/')[1];
        const decoder = new TextDecoder();
        const key = decoder.decode(fs.readFileSync('.repl/key'));
        const client = await connect(user, repl, key);

        const runner = client.openChannel({ service: 'shellrun' });
        runner.on('command', _ => console.log(_.output));
        await runner.request({ runMain: {}});

        runner.close();
        client.close();
    } else if (command == 'bash') {
        if (argv.length < 1) {
            console.log('Error: no repl to run');
            process.exit(1);
        }
        var user = argv[0].split('/')[0];
        var repl = argv[0].split('/')[1];
        const decoder = new TextDecoder();
        const key = decoder.decode(fs.readFileSync('.repl/key'));
        const client = await connect(user, repl, key);

        const exec = client.openChannel({ service: 'exec' });
        exec.on('command', function (out) {
            if (out.output) process.stdout.write(out.output);
            if (out.error) process.stdout.write(out.error);
        });

        while (1) {
            var cmd = readline.question('> ');
            var first = [cmd.split(' ')[0]];
            var args = cmd.split(' ').slice(1).join(' ');
            if (args) {
                first.push(args);
            }
            await exec.request({ exec: { args: first }});
        }
    } else if (command == 'hello') {
        console.log('Hello from replit-cli!');
    } else {
        console.log(`Unknown command ${command}`)
    }
}

start();
