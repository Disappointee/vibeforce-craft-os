/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("tasks")

    // add is_recurring bool field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "bool3770948286",
        "name": "is_recurring",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    // add recurring_interval select field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "select1579384326",
        "maxSelect": 1,
        "name": "recurring_interval",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
            "daily",
            "weekly",
            "monthly",
            "yearly",
            "custom"
        ]
    }))

    // add recurring_custom_days number field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "number2363389745",
        "max": null,
        "min": 1,
        "name": "recurring_custom_days",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    // add recurring_end_date date field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "date2375276105",
        "max": "",
        "min": "",
        "name": "recurring_end_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    // add recurring_next_date date field
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "date3888127722",
        "max": "",
        "min": "",
        "name": "recurring_next_date",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("tasks")

    const fieldsToRemove = ["is_recurring", "recurring_interval", "recurring_custom_days", "recurring_end_date", "recurring_next_date"]
    for (const name of fieldsToRemove) {
        const field = collection.fields.find((f) => f.name === name)
        if (field) {
            collection.fields.remove(field.id)
        }
    }

    return app.save(collection)
})
