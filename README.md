# Prompt Studio

Prompt Studio est une application web statique en français pour créer des prompts structurés, réutilisables et prêts à copier pour vos outils d'IA.

## Lancer en local

Aucune dépendance n'est nécessaire. Servez simplement le dossier avec un serveur statique :

```bash
python3 -m http.server 4173
```

Ouvrez ensuite <http://localhost:4173> dans votre navigateur.

## Fonctionnalités

- Formulaire guidé pour décrire un objectif, une audience, un contexte et des contraintes.
- 6 modèles de prompts : marketing, stratégie, code, apprentissage, analyse et créatif.
- Sélection du ton, du format et de la langue de sortie.
- Génération d'un prompt détaillé avec rôle, mission, angle de travail et consignes de réponse.
- Score qualité instantané pour savoir si le prompt contient assez de contexte.
- Historique local des 5 derniers prompts générés avec restauration en un clic.
- Bouton de copie vers le presse-papiers.
- Interface responsive pour ordinateur et mobile.
