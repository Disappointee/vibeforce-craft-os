/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("users")

    collection.fields.addAt(collection.fields.length, new Field({
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1780450100a",
        "max": 100,
        "min": 0,
        "name": "first_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
    }))

    collection.fields.addAt(collection.fields.length, new Field({
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1780450100b",
        "max": 100,
        "min": 0,
        "name": "last_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("users")

    const firstName = collection.fields.find((f) => f.name === "first_name")
    if (firstName) {
        collection.fields.remove(firstName.id)
    }

    const lastName = collection.fields.find((f) => f.name === "last_name")
    if (lastName) {
        collection.fields.remove(lastName.id)
    }

    return app.save(collection)
})
