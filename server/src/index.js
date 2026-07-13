import 'dotenv/config'
import { createApp } from './app.js'

const port = Number(process.env.PORT) || 3001
const server = createApp().listen(port, () => console.log(`EvolveFit API listening on http://localhost:${port}`))
function shutdown() { server.close(() => process.exit(0)) }
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
