/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/*', async ({ logger, request }) => {
  logger.info({ request: { url: request.url() } }, 'Hello world')

  return 'Hello world'
})
