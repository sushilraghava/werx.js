import {terser} from "rollup-plugin-terser";
import * as pkg from "./package.json";

const config = {
    input: "dist/esm/index.js",
    external: Object.keys(pkg.dependencies || {}).filter(key => /^werx-/.test(key)),
    output: {
        file: `dist/bundles/${pkg.name}.js`,
        name: "werx",
        format: "umd",
        indent: false,
        extend: false,
        banner: `// ${pkg.homepage} v${pkg.version} Copyright ${(new Date).getFullYear()} ${pkg.author}`,
        globals: Object.assign({}, ...Object.keys(pkg.dependencies || {}).filter(key => /^werx-/.test(key)).map(key => ({[key]: "werx"})))
    },
    plugins: []
};

export default [
    config,
    {
        ...config,
        output: {
            ...config.output,
            file: `dist/bundles/${pkg.name}.min.js`
        },
        plugins: [
            ...config.plugins,
            terser({
                output: {
                    preamble: config.output.banner
                }
            })
        ]
    }
];
