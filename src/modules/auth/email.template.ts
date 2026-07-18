export const getForgotPasswordTemplate = (code: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
    <tr>
      <td style="padding: 32px;">
        <h2 style="font-size: 24px; font-weight: bold; color: #111827; margin-top: 0; margin-bottom: 16px;">Recupera tu cuenta</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en GameConnect. Usa el siguiente código de verificación para continuar. Este código expira en 15 minutos.
        </p>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td align="center" style="padding: 16px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${code}</span>
            </td>
          </tr>
        </table>

        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
          Si tú no solicitaste este restablecimiento, puedes ignorar este correo de forma segura. Tu contraseña seguirá siendo la misma.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
          &copy; 2026 GameConnect. Todos los derechos reservados.<br>
          Este es un correo automático, por favor no respondas a esta dirección.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
};
