#!/usr/bin/env node

/**
 * Script de déploiement SFTP
 * Upload le contenu du dossier dist/ vers /straviz sur le serveur SFTP.
 * Variables d'environnement requises dans .env :
 *   SFTP_HOST     - Adresse du serveur SFTP
 *   SFTP_USER     - Nom d'utilisateur
 *   SFTP_KEY_PATH - Chemin vers la clé privée SSH (optionnel, remplace la saisie du mdp)
 *   SFTP_PORT     - Port SSH (défaut : 22)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import SftpClient from "ssh2-sftp-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// --- Chargement manuel du .env (sans dépendance dotenv) ---
function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) {
    console.error("Fichier .env introuvable.");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const { SFTP_HOST, SFTP_USER, SFTP_KEY_PATH, SFTP_PORT = "22" } = process.env;

if (!SFTP_HOST || !SFTP_USER) {
  console.error(
    "Variables manquantes : SFTP_HOST et SFTP_USER sont obligatoires.",
  );
  process.exit(1);
}

// --- Saisie interactive du mot de passe (masqué) ---
function promptPassword(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Désactive l'affichage des caractères saisis
    const onData = (char) => {
      char = char + "";
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          process.stdout.write("\n");
          break;
        default:
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(prompt + "*".repeat(rl.line.length));
      }
    };
    process.stdin.on("data", onData);

    rl.question(prompt, (answer) => {
      process.stdin.removeListener("data", onData);
      rl.close();
      resolve(answer);
    });
  });
}

const LOCAL_DIST = resolve(ROOT, "dist");
const REMOTE_DIR = "/straviz";

if (!existsSync(LOCAL_DIST)) {
  console.error(
    `Le dossier dist/ est introuvable. Lancez d'abord "yarn build".`,
  );
  process.exit(1);
}

// --- Upload ---
const sftp = new SftpClient();

async function deploy() {
  // Demande le mot de passe sauf si une clé SSH est configurée
  let password;
  if (!SFTP_KEY_PATH) {
    password = await promptPassword(
      `Mot de passe SFTP (${SFTP_USER}@${SFTP_HOST}) : `,
    );
    if (!password) {
      console.error("Mot de passe vide, abandon.");
      process.exit(1);
    }
  }

  const connectConfig = {
    host: SFTP_HOST,
    port: parseInt(SFTP_PORT, 10),
    username: SFTP_USER,
    ...(SFTP_KEY_PATH
      ? { privateKey: readFileSync(resolve(SFTP_KEY_PATH)) }
      : { password }),
  };

  console.log(`Connexion à ${SFTP_USER}@${SFTP_HOST}:${SFTP_PORT}...`);
  await sftp.connect(connectConfig);

  // Crée le répertoire distant s'il n'existe pas
  const exists = await sftp.exists(REMOTE_DIR);
  if (!exists) {
    console.log(`Création du répertoire distant ${REMOTE_DIR}...`);
    await sftp.mkdir(REMOTE_DIR, true);
  }

  console.log(`Upload de ${LOCAL_DIST} vers ${REMOTE_DIR}...`);
  await sftp.uploadDir(LOCAL_DIST, REMOTE_DIR);

  console.log("Déploiement terminé avec succès.");
}

deploy()
  .catch((err) => {
    console.error("Erreur lors du déploiement :", err.message);
    process.exit(1);
  })
  .finally(() => sftp.end());
