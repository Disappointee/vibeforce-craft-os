/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // add budget_fixed field (number)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "number1234567890",
        "max": null,
        "min": 0,
        "name": "budget_fixed",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    // add budget_type field (select: fixed, hourly, retainer)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "select1234567891",
        "maxSelect": 1,
        "name": "budget_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
            "fixed",
            "hourly",
            "retainer"
        ]
    }))

    // add external_costs_total field (number)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "number1234567892",
        "max": null,
        "min": 0,
        "name": "external_costs_total",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("projects")

    // remove budget_fixed field
    const f1 = collection.fields.find((f) => f.name === "budget_fixed")
    if (f1) collection.fields.remove(f1.id)

    // remove budget_type field
    const f2 = collection.fields.find((f) => f.name === "budget_type")
    if (f2) collection.fields.remove(f2.id)

    // remove external_costs_total field
    const f3 = collection.fields.find((f) => f.name === "external_costs_total")
    if (f3) collection.fields.remove(f3.id)

    return app.save(collection)
})
