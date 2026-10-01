import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdbhtojtxqxeqttqjomf.supabase.co'
const supabaseAnonKey = 'sb_publishable_ZHXkkugMTXZtuf41eUgzXw_Z4hvi3M8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function auditWorkOrders() {
  console.log('=== SUPABASE WORK ORDERS AUDIT ===')

  // Query table 'work_orders'
  const { data, error, count } = await supabase
    .from('work_orders')
    .select('*', { count: 'exact' })

  if (error) {
    console.error('Error fetching work_orders from Supabase:', error.message)
    return
  }

  const rawRows = data || []
  console.log(`Total Work Order rows in Supabase table 'work_orders': ${rawRows.length}`)

  let parsedOrders = []

  rawRows.forEach((row, idx) => {
    let wo = row
    if (row.data) {
      if (typeof row.data === 'string') {
        try { wo = JSON.parse(row.data) } catch (e) { wo = row }
      } else if (Array.isArray(row.data)) {
        // Packed array of work orders in single row
        wo = row.data
      } else {
        wo = row.data
      }
    }

    if (Array.isArray(wo)) {
      console.log(`Row [${idx+1}] ID '${row.id}' contains an ARRAY of ${wo.length} Work Orders!`)
      parsedOrders.push(...wo)
    } else {
      parsedOrders.push(wo)
    }
  })

  console.log(`\nTOTAL PARSED WORK ORDERS FOUND IN SUPABASE: ${parsedOrders.length}`)

  // Categorize Status & Dates
  const todayStr = '2026-08-11'
  let upcoming = 0
  let todaysShoot = 0
  let ongoing = 0
  let editing = 0
  let completed = 0
  let cancelled = 0
  let historical = 0

  parsedOrders.forEach((wo, i) => {
    const woNum = wo.work_order_number || wo.id
    const cust = wo.customer_name || 'Client'
    const status = (wo.status || 'upcoming').toLowerCase()
    const bookingDate = wo.booking_date || (wo.events && wo.events[0] && wo.events[0].event_date) || 'No Date'

    if (bookingDate < todayStr && bookingDate !== 'No Date') {
      historical++
    }

    if (status === 'upcoming') upcoming++
    else if (status === 'todays_shoot') todaysShoot++
    else if (status === 'ongoing' || status === 'in_progress') ongoing++
    else if (status === 'editing') editing++
    else if (status === 'completed' || status === 'delivered') completed++
    else if (status === 'cancelled') cancelled++

    console.log(`[${i+1}] ${woNum} | ${cust} | Status: ${status} | Date: ${bookingDate}`)
  })

  console.log('\n========================================')
  console.log('SUPABASE DATA BREAKDOWN:')
  console.log(`Total Work Orders: ${parsedOrders.length}`)
  console.log(`Upcoming: ${upcoming}`)
  console.log(`Today's: ${todaysShoot}`)
  console.log(`Ongoing: ${ongoing}`)
  console.log(`Editing: ${editing}`)
  console.log(`Completed: ${completed}`)
  console.log(`Cancelled: ${cancelled}`)
  console.log(`Historical (booking_date < Today): ${historical}`)
  console.log('========================================\n')
}

auditWorkOrders()
