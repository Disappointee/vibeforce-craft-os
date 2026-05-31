/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // add client relation field
    const field = new Field({
        "cascadeDelete": false,
        "collectionId": "pbc_clients",
        "help": "",
        "hidden": false,
        "id": "relation3515827341",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "client",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
    })

    collection.fields.addAt(collection.fields.length, field)

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // remove client relation field
    const field = collection.fields.find((f) => f.name === "client")
    if (field) {
        collection.fields.remove(field.id)
    }

    return app.save(collection)
})
