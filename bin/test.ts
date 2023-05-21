import 'dotenv/config'
import { assert } from '@japa/assert'
import { specReporter } from '@japa/spec-reporter'
import { processCliArgs, configure, run } from '@japa/runner'
import { pathToFileURL } from 'url'

/*
|--------------------------------------------------------------------------
| Configure tests
|--------------------------------------------------------------------------
|
| The configure method accepts the configuration to configure the Japa
| tests runner.
|
| The first method call "processCliArgs" process the command line arguments
| and turns them into a config object. Using this method is not mandatory.
|
| Please consult japa.dev/runner-config for the config docs.
*/
configure({
  ...processCliArgs(process.argv.slice(2)),
  plugins: [assert()],
  reporters: [specReporter()],
  forceExit: true,
  importer: (filePath) => import(pathToFileURL(filePath).href),
  suites: [
    {
      name: 'unit',
      files: ['tests/unit/**/*.spec.ts'],
    },
    {
      name: 'integration',
      files: ['tests/integration/**/*.spec.ts'],
      timeout: 10000,
    },
  ],
})

/*
|--------------------------------------------------------------------------
| Run tests
|--------------------------------------------------------------------------
|
| The following "run" method is required to execute all the tests.
|
*/
run()
