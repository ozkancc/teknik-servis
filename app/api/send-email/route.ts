import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const STATUS_LABELS: Record<string, string> = {
  beklemede:       'Beklemede',
  incelemede:      'İncelemede',
  onay_bekleniyor: 'Onay Bekleniyor',
  tamirde:         'Tamirde',
  tamamlandi:      'Tamamlandı',
  teslim_edildi:   'Teslim Edildi',
  iptal:           'İptal',
}

export async function POST(req: NextRequest) {
  try {
    const { to, customerName, orderNumber, status, deviceName, message } = await req.json()

    if (!to || !customerName || !orderNumber) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const statusLabel = STATUS_LABELS[status] ?? status
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    const { data, error } = await resend.emails.send({
      from: 'Gen Teknik Servis <onboarding@resend.dev>',
      to: [to],
      subject: `İş Emri #${orderNumber} — ${statusLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:#dc2626;padding:24px 32px;">
                      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">Gen Teknik Servis</h1>
                      <p style="margin:4px 0 0;color:#fecaca;font-size:13px;">İş Emri Bilgilendirmesi</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0 0 16px;color:#374151;font-size:15px;">Sayın <strong>${customerName}</strong>,</p>
                      
                      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                        ${message ?? `İş emrinizin durumu güncellendi.`}
                      </p>

                      <!-- Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px;">
                        <tr>
                          <td style="padding:20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color:#9ca3af;font-size:12px;padding-bottom:8px;">İŞ EMRİ NO</td>
                                <td align="right" style="color:#111827;font-size:14px;font-weight:bold;padding-bottom:8px;">#${orderNumber}</td>
                              </tr>
                              ${deviceName ? `
                              <tr>
                                <td style="color:#9ca3af;font-size:12px;padding-bottom:8px;">CİHAZ</td>
                                <td align="right" style="color:#374151;font-size:14px;padding-bottom:8px;">${deviceName}</td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="color:#9ca3af;font-size:12px;">DURUM</td>
                                <td align="right">
                                  <span style="background:#fee2e2;color:#dc2626;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;">${statusLabel}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 24px;color:#6b7280;font-size:13px;line-height:1.6;">
                        Sorularınız için bizi arayabilirsiniz. Hizmetimizi tercih ettiğiniz için teşekkür ederiz.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                        Gen Teknik Servis · Bu e-posta otomatik olarak gönderilmiştir.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}