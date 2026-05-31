/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_")

    // add language select field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "select3894763782",
        "maxSelect": 1,
        "name": "language",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
            "de",
            "en"
        ]
    }))

    // add notify_on_assignment bool field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "bool3894763783",
        "name": "notify_on_assignment",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    // add notify_on_mention bool field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "bool3894763784",
        "name": "notify_on_mention",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    // add notify_on_due bool field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "bool3894763785",
        "name": "notify_on_due",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    // add weekly_report bool field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "bool3894763786",
        "name": "weekly_report",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_")

    const fieldsToRemove = ["language", "notify_on_assignment", "notify_on_mention", "notify_on_due", "weekly_report"]
    fieldsToRemove.forEach((fieldName) => {
        const field = collection.fields.find((f) => f.name === fieldName)
        if (field) {
            collection.fields.remove(field.id)
        }
    })

    return app.save(collection)
})
