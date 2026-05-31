/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("pbc_786912933")

    // add is_billed field (bool)
    collection.fields.addAt(
        collection.fields.length,
        new Field({
            "hidden": false,
            "id": "bool2862495848",
            "name": "is_billed",
            "presentable": false,
            "required": false,
            "system": false,
            "type": "bool"
        })
    )

    // add billing_reference field (text)
    collection.fields.addAt(
        collection.fields.length,
        new Field({
            "autogeneratePattern": "",
            "hidden": false,
            "id": "text2862495849",
            "max": 255,
            "min": 0,
            "name": "billing_reference",
            "pattern": "",
            "presentable": false,
            "primaryKey": false,
            "required": false,
            "system": false,
            "type": "text"
        })
    )

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("pbc_786912933")

    // remove is_billed and billing_reference fields
    collection.fields.removeById("bool2862495848")
    collection.fields.removeById("text2862495849")

    return app.save(collection)
})
