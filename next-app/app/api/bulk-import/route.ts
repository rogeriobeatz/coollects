import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const db = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await db.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Faça login para iniciar uma importação.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { photoPaths?: unknown } | null
  const paths = body?.photoPaths

  if (
    !Array.isArray(paths) ||
    paths.length < 1 ||
    paths.length > 100 ||
    paths.some(path => typeof path !== 'string' || path.length > 300 || !path.startsWith(user.id + '/'))
  ) {
    return NextResponse.json({ error: 'Selecione de 1 a 100 fotos válidas.' }, { status: 400 })
  }

  if (new Set(paths).size !== paths.length) {
    return NextResponse.json({ error: 'Uma ou mais fotos foram repetidas. Limpe a seleção e tente novamente.' }, { status: 400 })
  }

  const { data: jobId, error } = await db.rpc('create_bulk_import_job', { p_photo_paths: paths })

  if (error || !jobId) {
    const diagnosticId = crypto.randomUUID()
    console.error('[bulk-import] create job failed', {
      diagnosticId,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      userId: user.id,
      photoCount: paths.length,
    })

    return NextResponse.json({
      error: 'Não foi possível registrar o lote no banco de dados.',
      diagnosticId,
      code: error?.code ?? 'EMPTY_JOB_ID',
    }, { status: 400 })
  }

  return NextResponse.json({ jobId, total: paths.length }, {
    status: 201,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET(request: Request) {
  const db = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await db.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Faça login novamente.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'Importação não informada.' }, { status: 400 })
  }

  const { data: job, error } = await db
    .from('bulk_import_jobs')
    .select('id,status,total_count,created_at,updated_at')
    .eq('id', jobId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error || !job) {
    return NextResponse.json({ error: 'Importação não encontrada.' }, { status: 404 })
  }

  const { data: items, error: itemError } = await db
    .from('bulk_import_items')
    .select('id,photo_path,status,suggestion,error_message,attempts,created_at')
    .eq('job_id', jobId)
    .eq('owner_id', user.id)
    .order('created_at')

  if (itemError) {
    console.error('[bulk-import] failed to load items', { code: itemError.code, message: itemError.message })
    return NextResponse.json({ error: 'Não foi possível carregar o progresso.' }, { status: 500 })
  }

  const counts = { queued: 0, processing: 0, ready: 0, failed: 0, saved: 0 }
  for (const item of items || []) counts[item.status as keyof typeof counts]++

  return NextResponse.json({ job, items, counts }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
