/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const collection = app.findCollectionByNameOrId("_pb_users_auth_")

    // add expertise (Aufgabengebiete) select field — multiple values allowed
    collection.fields.addAt(collection.fields.length, new Field({
        "help": "Aufgabengebiete des Nutzers (z.B. SEA, Social Ads, Tracking, SEO, Content, Design, Entwicklung, Beratung)",
        "hidden": false,
        "id": "select3894763787",
        "maxSelect": 9,
        "name": "expertise",
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
    const collection = app.findCollectionByNameOrId("_pb_users_auth_")

    const field = collection.fields.find((f) => f.name === "expertise")
    if (field) {
        collection.fields.remove(field.id)
    }

    return app.save(collection)
})
