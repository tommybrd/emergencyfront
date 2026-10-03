# Vérifications

Exécuter `node scripts/check.mjs` avec Node.js 24. Aucune installation npm n'est nécessaire.

Pour un contrôle rapide des ressources et de la syntaxe : `node scripts/check.mjs --static-only`. La suite complète contrôle ensuite les scénarios de simulation : PS hybride, deux CIS, renforts SPV, ville et ponts, livrées et signaux, santé des victimes, EPA, circulation, lances et eau, départs, transports au CH et retours. Le nombre de scénarios est affiché par le script. Certains tests de compatibilité vérifient des mécanismes dont les commandes ont été retirées ; ils ne signifient pas que ces commandes sont disponibles dans le jeu.

Les scénarios utilisent la géométrie Three.js réelle avec un remplacement du DOM et du rendu WebGL. Ils ne mesurent pas les FPS et ne remplacent pas un contrôle visuel. Pour quatre ambulances simultanées : `TEST_VSAVS=4 node --experimental-loader ./tests/runtime-loader.mjs tests/ambulance-mission.mjs`.

Le fichier autonome est également contrôlé : intégrité des modules, sons intégrés, syntaxe, crédits et une mission de deux VSAV exécutée depuis ses modules embarqués, jusqu'au dépôt au CH et au retour. La caméra et le rendu sont remplacés pour ce test automatique. Après modification du jeu, régénérer les fichiers de livraison avec `python3 scripts/prepare-release.py` avant de tester le fichier autonome. Voir [la reprise cloud](../CLOUD-HANDOFF.md).
