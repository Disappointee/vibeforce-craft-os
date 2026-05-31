/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("pbc_786912933")

    // add description field
    collection.fields.addAt(7, new Field({
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("pbc_786912933")

    // remove description field
    collection.fields.removeById("text1579384326")

    return app.save(collection)
})
