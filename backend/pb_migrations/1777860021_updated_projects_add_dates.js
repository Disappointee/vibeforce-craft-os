/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // add start_date field (date)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "date1234567893",
        "name": "start_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    // add due_date field (date)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "date1234567894",
        "name": "due_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // remove start_date field
    const f1 = collection.fields.find((f) => f.name === "start_date")
    if (f1) collection.fields.remove(f1.id)

    // remove due_date field
    const f2 = collection.fields.find((f) => f.name === "due_date")
    if (f2) collection.fields.remove(f2.id)

    return app.save(collection)
})
