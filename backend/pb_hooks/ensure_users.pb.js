/**
 * Ensure Users Boot Hook für Vibeforce Flow OS
 *
 * Garantiert, dass der Master-Admin-Login bei Bedarf existiert.
 * In der Produktion/Pre-Launch standardmäßig deaktiviert, um keine Passwörter zu überschreiben.
 */

// Deaktiviert für Produktivbetrieb
// onBootstrap((e) => {
//     e.next();
//     try {
//         const adminEmail = "***REMOVED***";
//         const adminPassword = "***REMOVED***";
//         try {
//             const existing = $app.findAuthRecordByEmail("users", adminEmail);
//             existing.set("role", "admin");
//             $app.save(existing);
//         } catch (_) {
//             const collection = $app.findCollectionByNameOrId("users");
//             const record = new Record(collection);
//             record.set("email", adminEmail);
//             record.set("password", adminPassword);
//             record.set("passwordConfirm", adminPassword);
//             record.set("name", "Admin User");
//             record.set("role", "admin");
//             record.set("emailVisibility", true);
//             $app.save(record);
//         }
//     } catch (err) {
//         console.error("[ensure_users] Boot error:", err);
//     }
// });
