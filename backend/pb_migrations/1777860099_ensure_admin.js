/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    // PRE-LAUNCH: Superuser-Passwort aus Env-Variable oder Default
    // Siehe: tasks/PRE_LAUNCH_CHECKLIST.md Abschnitt 1.5
    const superuserEmail = $os.getenv('PB_SUPERUSER_EMAIL') || "admin@example.com";
    const superuserPassword = ($os.getenv('PB_SUPERUSER_PASSWORD') || $os.getenv('PB_ADMIN_PASSWORD') || "").trim();

    if (!superuserPassword) {
        console.log('[ensure_admin] Kein Superuser-Passwort via ENV gesetzt – Migration übersprungen.');
        return;
    }
    
    try {
        // Versuchen, den Superuser zu finden
        const admin = app.findAuthRecordByEmail("_superusers", superuserEmail);
        
        // Passwort nur setzen, wenn der Superuser noch das Default-Passwort hat
        // oder wenn die Env-Variable explizit gesetzt wurde
        if ($os.getenv('PB_SUPERUSER_PASSWORD')) {
            admin.setPassword(superuserPassword);
            app.save(admin);
            console.log('[ensure_admin] Superuser-Passwort aus Env gesetzt.');
        } else {
            console.log('[ensure_admin] PB_SUPERUSER_PASSWORD nicht gesetzt – Superuser unverändert.');
        }
    } catch (e) {
        // Falls er nicht existiert, neu anlegen
        const collection = app.findCollectionByNameOrId("_superusers");
        const record = new Record(collection);
        
        record.setEmail(superuserEmail);
        record.setPassword(superuserPassword);
        
        app.save(record);
        console.log('[ensure_admin] Superuser erstellt: ' + superuserEmail);
    }
}, (app) => {
    // Optional: Beim Rückgängigmachen der Migration nichts tun
    return null;
})
