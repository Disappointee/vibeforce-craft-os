/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("tasks")

    // add type select field (Art: SEA, Social Ads, Tracking, SEO, etc.)
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "Art der Aufgabe (SEA, Social Ads, Tracking, SEO, etc.)",
        "hidden": false,
        "id": "select1579384326",
        "maxSelect": 1,
        "name": "type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
            "sea",
            "social_ads",
            "tracking",
            "seo",
            "content",
            "design",
            "development",
            "consulting",
            "other"
        ]
    }))

    return app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("tasks")

    const field = collection.fields.find((f) => f.name === "type")
    if (field) {
        collection.fields.remove(field.id)
    }

    return app.save(collection)
})
