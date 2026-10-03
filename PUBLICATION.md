# Mise en ligne

Activer GitHub Pages avec la source GitHub Actions. Après modification, exécuter `python3 scripts/prepare-release.py`, puis `node scripts/check.mjs`, et pousser sur la branche main une fois la publication autorisée. Le workflow publie dist après les vérifications. Le déploiement refuse de démarrer si le fichier LICENSE est absent.

Ce dépôt est autonome et éditable directement dans le cloud ; voir [CLOUD-HANDOFF.md](CLOUD-HANDOFF.md). Aucun exporteur privé ni dossier local historique n'est nécessaire. Cette copie ne contient pas l'historique privé ni les médias de référence. Le deux-tons est identique à celui du site et les documents officiels sont consultables par leurs liens. Un push GitHub ne met pas à jour l'hébergement Sites séparé.
