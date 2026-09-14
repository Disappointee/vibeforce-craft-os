/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("users")

    collection.fields.addAt(collection.fields.length, new Field({
        "hidden": false,
        "id": "bool1780450000",
        "name": "deactivated",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("users")

    const field = collection.fields.find((f) => f.name === "deactivated")
    if (field) {
        collection.fields.remove(field.id)
    }

    return app.save(collection)
})
