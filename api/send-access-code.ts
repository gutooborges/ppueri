import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  }

  const { email, patientName, accessCode, portalUrl } = req.body as {
    email?: string;
    patientName?: string;
    accessCode?: string;
    portalUrl?: string;
  };

  if (!email || !patientName || !accessCode) {
    return res.status(400).json({ error: 'Campos obrigatorios ausentes: email, patientName, accessCode.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Servico de e-mail nao configurado. Contate o administrador.',
    });
  }

  const portal = portalUrl || 'https://ppueri.vercel.app';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Codigo de Acesso Ppueri</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #bae6fd;max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 60%,#1d4ed8 100%);padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Ppueri</p>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;font-weight:500;">
                Prontuario Eletronico Pediatrico e Puericultura
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 6px;color:#0F172A;font-size:18px;font-weight:800;">
                Prontuario criado com sucesso
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:13px;line-height:1.7;">
                O prontuario de <strong style="color:#0F172A;">${patientName}</strong> foi cadastrado
                na plataforma Ppueri pelo pediatra responsavel.<br /><br />
                Use o codigo abaixo para criar sua conta no Portal dos Pais e acompanhar
                consultas, curvas de crescimento, vacinas e orientacoes medicas.
              </p>

              <!-- Access Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#eff6ff;border:2px solid #0EA5E9;border-radius:14px;padding:24px;text-align:center;">
                    <p style="margin:0 0 8px;color:#1E3A8A;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:3px;">
                      Codigo de Acesso
                    </p>
                    <p style="margin:0;color:#0F172A;font-size:30px;font-weight:900;font-family:Courier New,monospace;letter-spacing:4px;">
                      ${accessCode}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#f8fafc;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 10px;color:#334155;font-size:12px;font-weight:700;">
                      Como acessar o portal:
                    </p>
                    <p style="margin:0 0 6px;color:#475569;font-size:12px;line-height:1.6;">
                      1. Acesse <strong>${portal}</strong>
                    </p>
                    <p style="margin:0 0 6px;color:#475569;font-size:12px;line-height:1.6;">
                      2. Clique em &quot;Portal dos Pais&quot; e depois em &quot;Criar Conta&quot;
                    </p>
                    <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
                      3. Informe o Codigo de Acesso acima para vincular o prontuario
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${portal}"
                       style="display:inline-block;background:linear-gradient(135deg,#0EA5E9,#1E3A8A);color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Acessar o Portal dos Pais
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;line-height:1.6;">
                Guarde este codigo com seguranca. Ele e necessario apenas no primeiro acesso.<br />
                Em caso de duvidas, entre em contato diretamente com o consultorio.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                Ppueri — Saude Infantil em Nuvem<br />
                Conformidade com a LGPD. Dados protegidos em PostgreSQL criptografado.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ppueri <noreply@ppueri.vercel.app>',
        to: [email],
        subject: `Codigo de Acesso ao Prontuario de ${patientName} | Ppueri`,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[send-access-code] Resend error:', errorData);
      return res.status(502).json({ error: 'Falha no servico de e-mail. Tente novamente em instantes.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[send-access-code] Network error:', err);
    return res.status(500).json({ error: 'Erro interno ao enviar e-mail.' });
  }
}
