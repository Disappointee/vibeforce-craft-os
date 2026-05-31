/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("clients")

    // add auftragsvolumen (number, optional)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "number3774820341",
        "max": null,
        "min": null,
        "name": "auftragsvolumen",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    // add stundenhonorar (number, optional)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "number3774820342",
        "max": null,
        "min": null,
        "name": "stundenhonorar",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    // add stundenzahl_monatlich (number, optional)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "number3774820343",
        "max": null,
        "min": null,
        "name": "stundenzahl_monatlich",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    // add stundenzahl_gesamt (number, optional)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "number3774820344",
        "max": null,
        "min": null,
        "name": "stundenzahl_gesamt",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
    }))

    // add laufzeit_start (date, optional)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "date3774820345",
        "max": "",
        "min": "",
        "name": "laufzeit_start",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    // add laufzeit_ende (date, optional)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "date3774820346",
        "max": "",
        "min": "",
        "name": "laufzeit_ende",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
    }))

    // add abrechenbar (bool, default: true)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "bool3774820347",
        "name": "abrechenbar",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
    }))

    // add kundenstatus (select: noch_nicht_gestartet, aktiv, beendet, default: aktiv)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "",
        "hidden": false,
        "id": "select3774820348",
        "maxSelect": 1,
        "name": "kundenstatus",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
            "noch_nicht_gestartet",
            "aktiv",
            "beendet"
        ]
    }))

    // add betreuer (relation to users, optional, multiple)
    collection.fields.addAt(collection.fields.length, new Field({
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation3774820349",
        "maxSelect": null,
        "minSelect": 0,
        "name": "betreuer",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
    }))

    // add beobachter (relation to users, optional, multiple)
    collection.fields.addAt(collection.fields.length, new Field({
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation3774820350",
        "maxSelect": null,
        "minSelect": 0,
        "name": "beobachter",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("clients")

    const fieldsToRemove = [
        "auftragsvolumen",
        "stundenhonorar",
        "stundenzahl_monatlich",
        "stundenzahl_gesamt",
        "laufzeit_start",
        "laufzeit_ende",
        "abrechenbar",
        "kundenstatus",
        "betreuer",
        "beobachter"
    ]

    for (const fieldName of fieldsToRemove) {
        const field = collection.fields.find((f) => f.name === fieldName)
        if (field) {
            collection.fields.remove(field.id)
        }
    }

    return app.save(collection)
})
