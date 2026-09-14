/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("tasks")

    // add estimated_hours field (number)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "Geschätzter Aufwand in Stunden",
        "hidden": false,
        "id": "number9876543210",
        "max": null,
        "min": 0,
        "name": "estimated_hours",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("tasks")

    const field = collection.fields.find((f) => f.name === "estimated_hours")
    if (field) {
        collection.fields.remove(field.id)
    }

    return app.save(collection)
})
