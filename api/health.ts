export default function handler(_req: any, res: any) {
  res.json({
    status: 'ok',
    app: 'Ppueri PEP Pediátrico',
    version: '3.0.0-vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
}
