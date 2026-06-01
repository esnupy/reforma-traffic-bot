# Reforma Traffic Bot

Bot que consulta **X (Twitter)** en horarios fijos y te avisa por **Telegram** si el Metrobús en tu tramo de **Paseo de la Reforma** (Glorieta Cuitláhuac ↔ La Diana) está **LIBRE** o **NO LIBRE**.

Hosting **$0** con GitHub Actions.

## Horarios (Lun–Vie, hora CDMX)

| Ventana | Acción |
|---------|--------|
| 6:00 – 8:00 AM | Polling tramo **ida**; alerta si cambia a NO LIBRE |
| **7:45 AM** | Resumen diario LIBRE / NO LIBRE |
| 4:00 – 6:00 PM | Polling tramo **vuelta**; alerta si cambia a NO LIBRE |

## Setup

### 1. Bot de Telegram

1. Crea un bot con [@BotFather](https://t.me/BotFather) y guarda el token.
2. Obtén tu chat ID con [@userinfobot](https://t.me/userinfobot).
3. Envía `/start` a tu bot para poder recibir mensajes.

### 2. API de X

1. Regístrate en [developer.x.com](https://developer.x.com).
2. Crea una app y carga créditos pay-per-use (~$5 USD).
3. Copia el **Bearer Token**.

### 3. GitHub

1. Sube este repo a GitHub (**público** recomendado = minutos ilimitados).
2. Ve a **Settings → Secrets and variables → Actions** y agrega:

| Secret | Valor |
|--------|-------|
| `TELEGRAM_BOT_TOKEN` | Token de BotFather |
| `TELEGRAM_CHAT_ID` | Tu chat ID |
| `X_BEARER_TOKEN` | Bearer token de X |

3. **Actions → Reforma Bot → Run workflow** para probar manualmente.

## Desarrollo local

```bash
cp .env.example .env
# Edita .env con tus tokens

npm install
npm run job:digest   # resumen inmediato
npm run job:ida      # consulta ida
npm run job:vuelta   # consulta vuelta
```

## Consulta manual (sin /status en Telegram)

GitHub → **Actions** → **Reforma Bot** → **Run workflow**:

- `direction: ida` — consulta tramo mañana
- `direction: vuelta` — consulta tramo tarde
- `force: digest` — resumen estilo 7:45 AM

## Costo estimado

- **Hosting:** $0 (GitHub Actions)
- **X API:** ~$2–5 USD/mes (polling acotado Lun–Vie)

## Limitaciones

- Depende de tweets sobre Metrobús/Reforma; si nadie reporta, dirá LIBRE.
- GitHub Actions puede retrasar crons 1–10 min.
- No hay comandos `/status` en Telegram; usa **Run workflow** en GitHub.
