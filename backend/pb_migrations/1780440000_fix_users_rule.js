/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // fix updateRule because @collection.users.id causes an SQL error for auth collections.
  unmarshal({
    "updateRule": "id = @request.auth.id || @request.auth.role = 'admin'"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  unmarshal({
    "updateRule": "@request.auth.id = @collection.users.id || @request.auth.role = 'admin'"
  }, collection)

  return app.save(collection)
})
