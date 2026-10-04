#!/usr/bin/env python3
"""Génère la variante « corps seul » du site pour l'aperçu Artifact de Claude.

Le dossier contient une page autonome (doctype + head + body), telle qu'elle
sera servie par Vercel ou GitHub Pages. L'aperçu Artifact, lui, fournit son
propre squelette : il attend le contenu du body sans les balises englobantes.
Ce script dérive la seconde depuis la première — une seule source à maintenir.

La feuille de style et le script restent des fichiers à part : ils sont
publiés en pièces jointes de l'Artifact, aux mêmes chemins relatifs.
"""
import io, os, re

SRC = "index.html"
OUT = os.path.join(".artifact", "index.html")

html = io.open(SRC, encoding="utf-8").read()

title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).split("—")[0].strip()
body = html[html.index("<body>") + len("<body>"):html.rindex("</body>")].strip()
head = re.findall(r'<link rel="(?:preconnect|stylesheet)"[^>]*>', html)
head = [h for h in head if "fonts." in h or "leylor.css" in h]

os.makedirs(".artifact", exist_ok=True)
io.open(OUT, "w", encoding="utf-8", newline="\n").write(
    "<title>%s</title>\n%s\n\n%s\n" % (title, "\n".join(head), body)
)
print("ecrit %s (%d octets)" % (OUT, os.path.getsize(OUT)))
