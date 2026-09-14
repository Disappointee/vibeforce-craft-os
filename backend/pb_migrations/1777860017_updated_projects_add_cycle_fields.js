/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // add cycle_start_date field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "Start date of the current cycle",
        "hidden": false,
        "id": "date1234567893",
        "max": "",
        "min": "",
        "name": "cycle_start_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    // add cycle_end_date field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "End date of the current cycle (auto-rollover triggers on this date)",
        "hidden": false,
        "id": "date1234567894",
        "max": "",
        "min": "",
        "name": "cycle_end_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    // add cycle_number field (tracks which cycle we're on)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "Current cycle number (increments on each rollover)",
        "hidden": false,
        "id": "number1234567895",
        "max": null,
        "min": 0,
        "name": "cycle_number",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("projects")

    const fieldsToRemove = ["cycle_start_date", "cycle_end_date", "cycle_number"]
    for (const name of fieldsToRemove) {
        const field = collection.fields.find((f) => f.name === name)
        if (field) {
            collection.fields.remove(field.id)
        }
    }

    return app.save(collection)
})
