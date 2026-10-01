import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdbhtojtxqxeqttqjomf.supabase.co'
const supabaseAnonKey = 'sb_publishable_ZHXkkugMTXZtuf41eUgzXw_Z4hvi3M8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspectSources() {
  console.log('=== DEEP INSPECTION OF ALL WORK ORDER SOURCES ===')

  // 1. Supabase work_orders table
  const { data: woRows, error: woErr } = await supabase.from('work_orders').select('*')
  console.log(`Supabase 'work_orders' rows count: ${woRows ? woRows.length : 0}`)
  
  let allSupabaseWOs = new Map()

  if (woRows) {
    woRows.forEach((row) => {
      let content = row.data || row
      if (typeof content === 'string') {
        try { content = JSON.parse(content) } catch (e) {}
      }
      if (Array.isArray(content)) {
        content.forEach((item) => {
          const key = item.id || item.work_order_number
          if (key) allSupabaseWOs.set(key, item)
        })
      } else if (content && typeof content === 'object') {
        const key = content.id || content.work_order_number || row.id
        if (key && key !== 'main') allSupabaseWOs.set(key, content)
      }
    })
  }

  console.log(`Unique Work Orders found in Supabase 'work_orders' table: ${allSupabaseWOs.size}`)
  allSupabaseWOs.forEach((wo, id) => {
    console.log(` - WO: ${wo.work_order_number || id} | Customer: ${wo.customer_name} | Date: ${wo.booking_date || 'N/A'} | Status: ${wo.status}`)
  })

  // 2. Check enquiries converted
  const { data: enqRows } = await supabase.from('enquiries').select('*')
  if (enqRows) {
    enqRows.forEach((row) => {
      let items = row.data || row
      if (Array.isArray(items)) {
        items.forEach((e) => {
          if (e.converted_to_work_order || e.work_order_id) {
            console.log(`Enquiry Converted: #${e.enquiry_number} -> WO #${e.work_order_number} (${e.customer_name})`)
          }
        })
      }
    })
  }
}

inspectSources()
