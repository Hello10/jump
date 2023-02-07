# rollup.config.js
```
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { babel } from '@rollup/plugin-babel'

export default [
  {
    input: './src/api/index.js',
    output: [
      {
        file: './dist/es/api/index.js',
        format: 'es'
      },
            {
        file: './dist/cjs/api/index.js',
        format: 'cjs'
      }
    ]
  },
  {
    input: './src/shared/index.js',
    output: [
      {
        file: './dist/es/shared/index.js',
        format: 'es'
      },
            {
        file: './dist/cjs/shared/index.js',
        format: 'cjs'
      }
    ]
  },
  {
    input: './src/util/index.js',
    output: [
      {
        file: './dist/es/util/index.js',
        format: 'es'
      },
            {
        file: './dist/cjs/util/index.js',
        format: 'cjs'
      }
    ]
  },
  {
    input: './src/web/index.js',
    output: [
      {
        file: './dist/es/web/index.js',
        format: 'es'
      },
            {
        file: './dist/cjs/web/index.js',
        format: 'cjs'
      }
    ]
  },
  {
    plugins: [
      nodeResolve({
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
      babel({
          exclude: 'node_modules/**',
          presets: ['@babel/preset-env', '@babel/preset-react']
      }),
    ],
    external: ['react', 'graphql', 'react-dom', 'solid-start', 'lodash']
  }
]
```


# package.json
```
"devDependencies": {
  //...
  "@rollup/plugin-babel": "^6.0.3",
  "@rollup/plugin-commonjs": "^24.0.0",
  "@rollup/plugin-node-resolve": "^15.0.1",
}

"exports": {
  "./api": {
    "import": "./dist/es/api/index.js",
    "require": "./dist/cjs/api/index.js"
  },
  "./shared": {
    "import": "./dist/es/shared/index.js",
    "require": "./dist/cjs/shared/index.js"
  },
  "./util": {
    "import": "./dist/es/util/index.js",
    "require": "./dist/cjs/util/index.js"
  },
  "./web": {
    "import": "./dist/es/web/index.js",
    "require": "./dist/cjs/web/index.js"
  }
},
```

