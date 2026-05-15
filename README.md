# Briques 3D

Briques 3D est un mini jeu web statique en français inspiré des briques LEGO. Il permet de construire une scène en 3D directement dans le navigateur.

## Lancer en local

Aucune étape de build n'est nécessaire. Servez simplement le dossier avec un serveur statique :

```bash
python3 -m http.server 4173
```

Ouvrez ensuite <http://localhost:4173> dans votre navigateur.

## Fonctionnalités

- Plateau 3D en CSS avec rotation de vue au glisser, zoom à la molette et ombres dynamiques.
- Pose de briques sur une grille avec empilement automatique par niveau.
- 4 tailles de briques : 1 × 1, 1 × 2, 2 × 2 et 4 × 2.
- Palette de 6 couleurs et rotation des briques à 0° ou 90°.
- Mode suppression pour retirer une brique ciblée.
- Missions de construction : nombre de briques, hauteur et variété de couleurs.
- Sauvegarde et chargement de la construction via `localStorage`.
- Interface responsive pour ordinateur, tablette et mobile.
