import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone') ?? ''
  const digits = phone.replace(/\D/g, '').slice(-10)

  if (!digits || digits.length < 7) {
    return NextResponse.json({ error: 'Geçersiz telefon' }, { status: 400 })
  }

  const { data: customers, error: cErr } = await supabase
    .from('customers')
    .select('id, full_name')
    .ilike('phone', `%${digits}%`)
    .limit(1)

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
  if (!customers || customers.length === 0) {
    return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  }

  const customer = customers[0]

  const { data: orders, error: oErr } = await supabase
    .from('work_orders')
    .select(`
      id, order_number, status, problem_description, diagnosis, created_at, updated_at,
      devices:device_id(brand, model, serial_number),
      technicians:technician_id(full_name)
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })

  return NextResponse.json({ customer, orders })
}