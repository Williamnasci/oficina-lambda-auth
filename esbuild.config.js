const esbuild = require('esbuild');
const path = require('path');

const entries = ['auth-login', 'auth-authorizer'];

async function build() {
    for (const name of entries) {
        await esbuild.build({
            entryPoints: [path.join('src', `${name}.ts`)],
            bundle: true,
            platform: 'node',
            target: 'node20',
            outfile: path.join('dist', name, 'index.js'),
            external: ['@aws-sdk/*'], // ja vem no runtime Lambda Node 20
            sourcemap: false,
            minify: false,
        });
        console.log(`built dist/${name}/index.js`);
    }
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
