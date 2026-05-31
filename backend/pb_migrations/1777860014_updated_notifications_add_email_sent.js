/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("notifications")

    // add email_sent bool field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "Wurde bereits eine E-Mail-Benachrichtigung versendet?",
        "hidden": false,
        "id": "bool3894763788",
        "name": "email_sent",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("notifications")

    const field = collection.fields.find((f) => f.name === "email_sent")
    if (field) {
        collection.fields.remove(field.id)
    }

    return app.save(collection)
})
