const fsextra = require('fs-extra');
const { exec } = require('child_process');

fsextra.copy('./src/app/tag-input', './dist-lib', err => {
    if (err) return console.error(err);
    console.log('Copied files');
    createDeclarations();
});

function createDeclarations() {
    exec('cd dist-lib && ../node_modules/.bin/tsc index.ts --declaration', () => {
        console.log('Generated declarations (and some JS files...)');
        createPackageJson();
    });
}

function createPackageJson() {
    const packageJSON = {
        "name": "angular-tag-input",
        "version": "2.0.2",
        "description": "Angular 5+ library for chips",
        "main": "index.js",
        "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "repository": {
            "type": "git",
            "url": "git+https://github.com/kennyrulez/angular-tag-input"
        },
        "keywords": [
            "angular",
            "library",
            "chip",
            "tag-input",
            "autocomplete",
            "tags"
        ],
        "author": "fornito.valerio@gmail.com",
        "license": "MIT",
        "bugs": {
            "url": "https://github.com/kennyrulez/angular-tag-input/issues"
        },
        "homepage": "https://github.com/kennyrulez/angular-tag-input#readme",
        "types": "index.d.ts"
    };
    fsextra.writeJson('./dist-lib/package.json', packageJSON, { spaces: 2 }, err => {
        if (err) return console.error(err);
        console.log('Created package.json');
    });
}
