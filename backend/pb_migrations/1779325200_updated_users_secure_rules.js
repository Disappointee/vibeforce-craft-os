/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data — restrict create to admins, update to self or admin
  unmarshal({
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.id = @collection.users.id || @request.auth.role = 'admin'"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // revert to previous permissive rules
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
})
