# 🚀 Déploiement Excel Creator + n8n sur statlabo.com

## Votre Configuration
- **Domaine**: statlabo.com
- **Sous-domaine n8n**: n8n.statlabo.com
- **Hébergeur DNS**: Hostinger
- **Serveur**: Oracle Cloud (France South - Marseille)
- **Apps**: Excel Creator + n8n (automatisation)

---

## Étape 1: Créer la VM Oracle Cloud

1. Sur votre dashboard Oracle, cliquez **"Create a VM instance"**
2. Configurez:
   - **Name**: `statlabo-excel`
   - **Image**: Ubuntu 22.04
   - **Shape**: VM.Standard.E2.1.Micro (GRATUIT)
   - **SSH Key**: Générez et TÉLÉCHARGEZ la clé privée
3. Cliquez **Create**
4. Attendez "RUNNING" (~2 min)
5. **COPIEZ L'IP PUBLIQUE** (ex: 129.151.xxx.xxx)

---

## Étape 2: Ouvrir les Ports Oracle

1. Cliquez sur votre instance → **Primary VNIC** → **Subnet**
2. **Security Lists** → Default Security List
3. **Add Ingress Rules**:

```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 80
```

Répétez pour le port 443.

---

## Étape 3: Configurer DNS Hostinger

1. Allez sur https://hpanel.hostinger.com
2. **Domaines** → **statlabo.com**
3. **DNS / Nameservers** → **Gérer les enregistrements DNS**
4. **SUPPRIMEZ** les anciens enregistrements A
5. **AJOUTEZ**:

| Type | Nom | Pointe vers |
|------|-----|-------------|
| A    | @   | [IP_ORACLE] |
| A    | www | [IP_ORACLE] |
| A    | n8n | [IP_ORACLE] |

Remplacez [IP_ORACLE] par l'IP de votre VM.

---

## Étape 4: Connexion SSH (Windows PowerShell)

```powershell
cd C:\Users\reda\Downloads
ssh -i ssh-key-*.key ubuntu@[IP_ORACLE]
```

---

## Étape 5: Installer Docker sur le VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git -y
sudo usermod -aG docker ubuntu
sudo systemctl enable docker

# Ouvrir les ports firewall
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo apt install iptables-persistent -y

# Déconnexion pour appliquer les groupes
exit
```

Reconnectez-vous: `ssh -i ssh-key-*.key ubuntu@[IP_ORACLE]`

---

## Étape 6: Transférer le Projet

### Depuis Windows PowerShell:
```powershell
cd "C:\Users\reda\Desktop\python automatisation"
scp -i "C:\Users\reda\Downloads\ssh-key-*.key" -r bp_web ubuntu@[IP_ORACLE]:~/
```

---

## Étape 7: Configurer et Lancer

### Sur le VPS:
```bash
cd ~/bp_web

# Créer le fichier .env
cat > .env << 'EOF'
DEBUG=False
DJANGO_SECRET_KEY=votre-cle-secrete-super-longue-12345678901234567890
ALLOWED_HOSTS=statlabo.com,www.statlabo.com,[IP_ORACLE]
ZAI_API_KEY=votre-cle-api-zai
EOF

# Lancer Docker
docker-compose up -d --build

# Vérifier
docker-compose ps
```

Testez: http://[IP_ORACLE] dans votre navigateur

---

## Étape 8: SSL HTTPS (Let's Encrypt)

```bash
# Arrêter nginx
docker-compose down

# Installer Certbot
sudo apt install certbot -y

# Obtenir le certificat
sudo certbot certonly --standalone -d statlabo.com -d www.statlabo.com

# Copier les certificats
sudo mkdir -p ~/bp_web/nginx/ssl
sudo cp /etc/letsencrypt/live/statlabo.com/fullchain.pem ~/bp_web/nginx/ssl/
sudo cp /etc/letsencrypt/live/statlabo.com/privkey.pem ~/bp_web/nginx/ssl/
sudo chown -R ubuntu:ubuntu ~/bp_web/nginx/ssl

# Relancer
docker-compose up -d
```

---

## ✅ Terminé!

Vos applications seront accessibles sur:
- **https://statlabo.com** → Excel Creator
- **https://www.statlabo.com** → Excel Creator
- **http://[IP]:5678** → n8n (ou https://n8n.statlabo.com après config)

### Accès n8n:
- **URL**: http://[IP_ORACLE]:5678
- **User**: admin
- **Password**: changeme123 (à modifier dans .env)

---

## Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f

# Logs n8n uniquement
docker-compose logs -f n8n

# Redémarrer
docker-compose restart

# Mettre à jour
git pull && docker-compose up -d --build
```

---

## Checklist

- [ ] VM Oracle créée
- [ ] IP publique notée: _______________
- [ ] Ports 80/443/5678 ouverts dans Security List
- [ ] DNS Hostinger configuré (@ + www + n8n)
- [ ] Docker installé sur VPS
- [ ] Projet transféré
- [ ] .env configuré
- [ ] docker-compose up -d
- [ ] Excel Creator accessible http://[IP]
- [ ] n8n accessible http://[IP]:5678
- [ ] SSL installé
- [ ] https://statlabo.com fonctionne ✅

